from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models
from ..database import get_db
from ..dependencies import get_current_user
from pydantic import BaseModel
import sys
from pathlib import Path

# Add project root to sys.path to import nlp_engine
sys.path.append(str(Path(__file__).parent.parent.parent))
from nlp_engine.pipeline import ThoughtVelocityPipeline

pipeline_instance = ThoughtVelocityPipeline()

router = APIRouter(prefix="/api/responses", tags=["responses"])

class ResponseSubmit(BaseModel):
    assignment_id: int
    content: str

@router.post("/")
def submit_response(req: ResponseSubmit, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    user = db.query(models.User).filter(models.User.username == current_user["sub"]).first()
    if not user or user.role != models.UserRole.student:
        raise HTTPException(status_code=403, detail="Only students can submit responses")
    
    student = db.query(models.Student).filter(models.Student.user_id == user.id).first()
    
    assignment = db.query(models.Assignment).filter(models.Assignment.id == req.assignment_id, models.Assignment.student_id == student.id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
        
    if assignment.status == "completed":
        raise HTTPException(status_code=400, detail="Assignment already completed")

    # Create session (mocking session tracking for simplicity)
    new_session = models.Session(student_id=student.id)
    db.add(new_session)
    db.commit()
    db.refresh(new_session)

    # Create response
    new_response = models.Response(
        student_id=student.id,
        session_id=new_session.id,
        prompt=assignment.topic,
        content=req.content
    )
    db.add(new_response)
    db.commit()
    db.refresh(new_response)
    
    # NLP Pipeline Extraction
    doc = pipeline_instance.nlp(req.content)
    dimensions, embedding = pipeline_instance.extract_dimensions(req.content, doc, topic=assignment.topic)
    
    # Save Profile
    profile = models.ThinkingProfile(
        student_id=student.id,
        response_id=new_response.id,
        semantic_depth=dimensions['semantic_depth'],
        abstraction_level=dimensions['abstraction_level'],
        reasoning_structure=dimensions['reasoning_structure'],
        cross_domain_links=dimensions['cross_domain_links'],
        confidence_pattern=dimensions['confidence_pattern'],
        vocabulary_expansion=dimensions['vocabulary_expansion']
    )
    db.add(profile)
    
    # Mark Assignment Complete
    assignment.status = "completed"
    
    db.commit()
    
    return {
        "message": "Response submitted successfully and thought velocity computed",
        "dimensions": {
            "semantic_depth": dimensions['semantic_depth'],
            "abstraction_level": dimensions['abstraction_level'],
            "reasoning_structure": dimensions['reasoning_structure'],
            "cross_domain_links": dimensions['cross_domain_links'],
            "confidence_pattern": dimensions['confidence_pattern'],
            "vocabulary_expansion": dimensions['vocabulary_expansion']
        }
    }
