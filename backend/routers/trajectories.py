from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas
from ..database import get_db
from ..dependencies import get_current_user
import sys
import numpy as np
from pathlib import Path

# Add project root to sys.path to import nlp_engine
sys.path.append(str(Path(__file__).parent.parent.parent))
from nlp_engine.velocity import VelocityTracker

tracker = VelocityTracker()

router = APIRouter(prefix="/api/trajectories", tags=["trajectories"])

DIMS = ["semantic_depth", "abstraction_level", "reasoning_structure", "cross_domain_links", "confidence_pattern", "vocabulary_expansion"]

def _compute_velocity_magnitude(snapshots: list) -> float:
    """Compute average velocity magnitude across all consecutive snapshot pairs."""
    if len(snapshots) < 2:
        return 0.0
    magnitudes = []
    for i in range(1, len(snapshots)):
        prev = np.array([snapshots[i-1].get(d, 0) for d in DIMS])
        curr = np.array([snapshots[i].get(d, 0) for d in DIMS])
        magnitudes.append(float(np.linalg.norm(curr - prev)))
    return round(float(np.mean(magnitudes)), 4) if magnitudes else 0.0

def _compute_dim_trends(snapshots: list) -> dict:
    """Compute trend direction (up/down/stable) for each dimension."""
    if len(snapshots) < 2:
        return {d: "stable" for d in DIMS}
    trends = {}
    for d in DIMS:
        first = snapshots[0].get(d, 0)
        last = snapshots[-1].get(d, 0)
        delta = last - first
        if delta > 0.05:
            trends[d] = "up"
        elif delta < -0.05:
            trends[d] = "down"
        else:
            trends[d] = "stable"
    return trends

@router.get("/cohort/summary")
def get_cohort_summary(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Cohort summary for faculty — per-student velocity magnitude, deceleration flag, and trend."""
    students = db.query(models.Student).all()
    result = []
    for student in students:
        profiles = db.query(models.ThinkingProfile).filter(
            models.ThinkingProfile.student_id == student.id
        ).order_by(models.ThinkingProfile.timestamp).all()

        snapshots = [{
            "timestamp": p.timestamp.isoformat(),
            "semantic_depth": p.semantic_depth,
            "abstraction_level": p.abstraction_level,
            "reasoning_structure": p.reasoning_structure,
            "cross_domain_links": p.cross_domain_links,
            "confidence_pattern": p.confidence_pattern,
            "vocabulary_expansion": p.vocabulary_expansion
        } for p in profiles]

        vel_magnitude = _compute_velocity_magnitude(snapshots)
        dim_trends = _compute_dim_trends(snapshots)
        decel = tracker.detect_deceleration(snapshots) if len(snapshots) > 2 else {"warning": False, "velocities": []}
        latest = snapshots[-1] if snapshots else None

        result.append({
            "student_id": student.id,
            "student_name": student.name,
            "department": student.user.department if student.user else None,
            "submission_count": len(snapshots),
            "velocity_magnitude": vel_magnitude,
            "decelerating": decel.get("warning", False),
            "deceleration_flags": [],
            "dimension_trends": dim_trends,
            "latest_snapshot": latest
        })

    # Sort by velocity magnitude descending
    result.sort(key=lambda x: x["velocity_magnitude"], reverse=True)
    return result

@router.get("/cohort/full")
def get_cohort_full(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Full cohort trajectories for comparative radar overlay."""
    students = db.query(models.Student).all()
    result = []
    for student in students:
        profiles = db.query(models.ThinkingProfile).filter(
            models.ThinkingProfile.student_id == student.id
        ).order_by(models.ThinkingProfile.timestamp).all()
        snapshots = [{
            "timestamp": p.timestamp.isoformat(),
            "semantic_depth": p.semantic_depth,
            "abstraction_level": p.abstraction_level,
            "reasoning_structure": p.reasoning_structure,
            "cross_domain_links": p.cross_domain_links,
            "confidence_pattern": p.confidence_pattern,
            "vocabulary_expansion": p.vocabulary_expansion
        } for p in profiles]
        result.append({
            "student_id": student.id,
            "student_name": student.name,
            "snapshots": snapshots
        })
    return result

@router.get("/{student_id}")
def get_student_trajectory(student_id: int, db: Session = Depends(get_db)):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    profiles = db.query(models.ThinkingProfile).filter(models.ThinkingProfile.student_id == student_id).order_by(models.ThinkingProfile.timestamp).all()
    
    snapshots = []
    profiles_for_analysis = []
    
    for p in profiles:
        snap_dict = {
            "timestamp": p.timestamp.isoformat(),
            "semantic_depth": p.semantic_depth,
            "abstraction_level": p.abstraction_level,
            "reasoning_structure": p.reasoning_structure,
            "cross_domain_links": p.cross_domain_links,
            "confidence_pattern": p.confidence_pattern,
            "vocabulary_expansion": p.vocabulary_expansion
        }
        snapshots.append(snap_dict)
        profiles_for_analysis.append(snap_dict)

    velocity_magnitude = _compute_velocity_magnitude(snapshots)
    dim_trends = _compute_dim_trends(snapshots)
    analysis_result = tracker.detect_deceleration(profiles_for_analysis) if len(profiles_for_analysis) > 2 else {"warning": False, "velocities": []}
            
    return {
        "student_id": student_id,
        "student_name": student.name,
        "snapshots": snapshots,
        "velocity_magnitude": velocity_magnitude,
        "dimension_trends": dim_trends,
        "analysis": {
            "decelerating": analysis_result.get("warning", False),
            "flags": []
        }
    }
