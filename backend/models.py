import enum
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text, Enum, Boolean
from sqlalchemy.orm import relationship
import datetime
from .database import Base

class UserRole(str, enum.Enum):
    admin = "admin"
    faculty = "faculty"
    student = "student"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(Enum(UserRole), default=UserRole.student)
    display_name = Column(String, nullable=True)
    bio = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    needs_password_change = Column(Boolean, default=True)
    department = Column(String, nullable=True)
    is_department_locked = Column(Boolean, default=False)

    # Relationships
    student_profile = relationship("Student", back_populates="user", uselist=False)

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    name = Column(String, index=True)
    
    user = relationship("User", back_populates="student_profile")
    sessions = relationship("Session", back_populates="student")
    responses = relationship("Response", back_populates="student")
    profiles = relationship("ThinkingProfile", back_populates="student")

class Session(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), index=True)
    start_time = Column(DateTime, default=datetime.datetime.utcnow)
    end_time = Column(DateTime, nullable=True)

    student = relationship("Student", back_populates="sessions")
    responses = relationship("Response", back_populates="session")

class Assignment(Base):
    __tablename__ = "assignments"
    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("users.id"), index=True)
    student_id = Column(Integer, ForeignKey("students.id"), index=True)
    topic = Column(String)
    status = Column(String, default="pending")
    
class Response(Base):
    __tablename__ = "responses"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), index=True)
    session_id = Column(Integer, ForeignKey("sessions.id"), index=True)
    prompt = Column(Text)
    content = Column(Text)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    student = relationship("Student", back_populates="responses")
    session = relationship("Session", back_populates="responses")
    profile_snapshot = relationship("ThinkingProfile", back_populates="response", uselist=False)

class ThinkingProfile(Base):
    __tablename__ = "thinking_profiles"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), index=True)
    response_id = Column(Integer, ForeignKey("responses.id"), index=True)
    
    # 6 Dimensions
    semantic_depth = Column(Float)
    abstraction_level = Column(Float)
    reasoning_structure = Column(Float)
    cross_domain_links = Column(Float)
    confidence_pattern = Column(Float)
    vocabulary_expansion = Column(Float)

    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    student = relationship("Student", back_populates="profiles")
    response = relationship("Response", back_populates="profile_snapshot")

class AssignmentRequest(Base):
    __tablename__ = "assignment_requests"

    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("users.id"), index=True)
    student_id = Column(Integer, ForeignKey("students.id"), index=True)
    topic = Column(Text)
    status = Column(String, default="pending") # pending, approved, rejected
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    teacher = relationship("User", foreign_keys=[teacher_id])
    student = relationship("Student", foreign_keys=[student_id])

class ConcernRequest(Base):
    __tablename__ = "concern_requests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    concern_type = Column(String) # e.g. "bio", "photo", "department", "general"
    topic = Column(String)
    description = Column(Text)
    attachment_url = Column(String, nullable=True)
    status = Column(String, default="pending") # pending, approved, rejected
    admin_remarks = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", foreign_keys=[user_id])
