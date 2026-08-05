"""
SECURITY NOTE: 
Currently, Row Level Security (RLS) is NOT enforced at the database level. 
The backend connects to PostgreSQL using SQLAlchemy with a direct connection string, 
which bypasses Supabase RLS policies. Security is entirely enforced at the application layer 
in this file (via Depends(get_current_user) and explicit SQLAlchemy filters).
Ensure full RLS/JWT integration is evaluated before any production deployment with real student data.
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
import sys
import os
import datetime

# Add parent directory to path to allow absolute imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from features.extractor import FeatureExtractor, FeatureNormalizer
from embeddings.embedder import SemanticEmbedder
from velocity.tracker import VelocityTracker
from clustering.cluster import CohortClusterer

# Import dependencies for authentication and DB
from backend.dependencies import get_current_user
from backend.database import get_db
from backend import models

router = APIRouter()

# Instantiate NLP components
extractor = FeatureExtractor()
normalizer = FeatureNormalizer()
embedder = SemanticEmbedder()
tracker = VelocityTracker()
clusterer = CohortClusterer()

class ResponsePayload(BaseModel):
    student_id: int
    text: str
    prompt: str = ""

@router.post("/responses")
async def process_response(
    payload: ResponsePayload, 
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Retrieve user from DB to check role
    user = db.query(models.User).filter(models.User.username == current_user["sub"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    student = db.query(models.Student).filter(models.Student.id == payload.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    # Authorization logic: Only the student themselves or faculty/admin can post a response for this student
    if user.role == models.UserRole.student and student.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized to submit responses for this student")

    text = payload.text
    
    # 1. Extract 6D features
    features = extractor.extract_dimensions(text)
    
    # Create Response record
    new_response = models.Response(
        student_id=student.id,
        prompt=payload.prompt,
        content=text
    )
    db.add(new_response)
    db.flush() # Get response ID
    
    # Create ThinkingProfile snapshot
    new_profile = models.ThinkingProfile(
        student_id=student.id,
        response_id=new_response.id,
        semantic_depth=features["semantic_depth"],
        abstraction_level=features["abstraction_level"],
        reasoning_structure=features["reasoning_structure"],
        cross_domain_links=features["cross_domain_links"],
        confidence_pattern=features["confidence_pattern"],
        vocabulary_expansion=features["vocabulary_expansion"]
    )
    db.add(new_profile)
    db.commit()
    
    return {"status": "success", "response_id": new_response.id, "features": features}

@router.get("/students/{student_id}/profile")
async def get_student_profile(
    student_id: int, 
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.username == current_user["sub"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    # Authorization logic: Scoped to self (if student) or all (if faculty/admin)
    if user.role == models.UserRole.student and student.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this profile")
        
    profiles = db.query(models.ThinkingProfile).filter(
        models.ThinkingProfile.student_id == student.id
    ).order_by(models.ThinkingProfile.timestamp).all()
    
    if not profiles:
        raise HTTPException(status_code=404, detail="No cognitive profiles recorded yet")
        
    # Serialize profiles for velocity tracking
    session_features = [{
        "semantic_depth": p.semantic_depth,
        "abstraction_level": p.abstraction_level,
        "reasoning_structure": p.reasoning_structure,
        "cross_domain_links": p.cross_domain_links,
        "confidence_pattern": p.confidence_pattern,
        "vocabulary_expansion": p.vocabulary_expansion
    } for p in profiles]
    
    warning_info = tracker.detect_deceleration(session_features, z_threshold=-0.5)
    
    return {
        "student_id": student.id,
        "history_length": len(profiles),
        "latest_features": session_features[-1],
        "velocity_analysis": warning_info
    }

@router.get("/faculty/alerts")
async def get_faculty_alerts(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.username == current_user["sub"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Authorization logic: strictly faculty or admin
    if user.role not in [models.UserRole.faculty, models.UserRole.admin]:
        raise HTTPException(status_code=403, detail="Only faculty or admins can view alerts")
        
    students = db.query(models.Student).all()
    alerts = []
    
    for student in students:
        profiles = db.query(models.ThinkingProfile).filter(
            models.ThinkingProfile.student_id == student.id
        ).order_by(models.ThinkingProfile.timestamp).all()
        
        if len(profiles) >= 3:
            session_features = [{
                "semantic_depth": p.semantic_depth,
                "abstraction_level": p.abstraction_level,
                "reasoning_structure": p.reasoning_structure,
                "cross_domain_links": p.cross_domain_links,
                "confidence_pattern": p.confidence_pattern,
                "vocabulary_expansion": p.vocabulary_expansion
            } for p in profiles]
            
            warning_info = tracker.detect_deceleration(session_features, z_threshold=-0.5)
            
            if warning_info["warning"]:
                alerts.append({
                    "student_id": student.id,
                    "student_name": student.name,
                    "latest_z_score": warning_info.get("latest_z_score", 0.0),
                    "velocities": warning_info["velocities"][-1] if warning_info["velocities"] else {}
                })
                
    return {"alerts": alerts, "total_monitored": len(students)}
