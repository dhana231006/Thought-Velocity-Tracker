from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class ResponseCreate(BaseModel):
    student_id: str
    assignment_id: Optional[int] = None
    prompt_text: str
    response_text: str

class AssignmentCreate(BaseModel):
    student_id: str
    topic: str

class AssignmentResponse(BaseModel):
    id: int
    teacher_id: str
    student_id: str
    topic: str
    completed: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class ProfileSnapshotBase(BaseModel):
    semantic_depth: float
    abstraction_level: float
    reasoning_structure: float
    cross_domain_links: float
    confidence_pattern: float
    vocabulary_expansion: float

class ProfileSnapshotResponse(ProfileSnapshotBase):
    id: int
    session_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class VelocityInfo(BaseModel):
    delta_vector: dict
    magnitude: float
    cosine_similarity: float
    scalar_velocity: float

class TrajectoryAnalysis(BaseModel):
    warning: bool
    consecutive_decelerations: int
    velocities: List[VelocityInfo]

class TrajectoryResponse(BaseModel):
    student_id: str
    snapshots: List[ProfileSnapshotResponse]
    analysis: Optional[TrajectoryAnalysis] = None
