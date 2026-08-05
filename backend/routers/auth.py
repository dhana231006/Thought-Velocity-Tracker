from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from ..database import get_db
from ..models import User, UserRole, Student
from ..auth import verify_password, get_password_hash, create_access_token
from ..dependencies import get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])

ADMIN_AUTH_ID = "4721f921-6988-47cf-ad03-1562e1b95add"

class LoginRequest(BaseModel):
    username: str
    password: str

class CreateUserRequest(BaseModel):
    username: str
    password: str
    role: UserRole
    admin_auth_id: str | None = None
    department: str | None = None

@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    # Special bypass login if username is admin and password is the admin auth ID
    if req.username == "admin" and (req.password == "admin123" or req.password == ADMIN_AUTH_ID):
        user = db.query(User).filter(User.username == "admin").first()
        if not user:
            user = User(username="admin", hashed_password=get_password_hash("admin123"), role=UserRole.admin, needs_password_change=False)
            db.add(user)
            db.commit()
            db.refresh(user)
        access_token = create_access_token(data={"sub": user.username, "role": user.role.value})
        return {"access_token": access_token, "token_type": "bearer", "role": user.role.value, "needs_password_change": user.needs_password_change}

    user = db.query(User).filter(User.username == req.username).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": user.username, "role": user.role.value})
    return {"access_token": access_token, "token_type": "bearer", "role": user.role.value, "needs_password_change": user.needs_password_change}

@router.post("/users")
def create_user(req: CreateUserRequest, db: Session = Depends(get_db)):
    # Validate Admin Auth ID for creating faculty or student accounts if required or allow direct admin registration
    existing = db.query(User).filter(User.username == req.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    new_user = User(
        username=req.username,
        hashed_password=get_password_hash(req.password),
        role=req.role,
        needs_password_change=True,
        department=req.department,
        is_department_locked=True if req.department else False
    )
    db.add(new_user)
    db.commit()
    if req.role == UserRole.student:
        student = Student(user_id=new_user.id, name=req.username)
        db.add(student)
        db.commit()

    return {"msg": f"{req.role.value.capitalize()} account created successfully"}

@router.get("/users")
def list_users(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    users = db.query(User).all()
    return [
        {
            "id": u.id,
            "username": u.username,
            "role": u.role.value,
            "display_name": u.display_name or u.username,
            "bio": u.bio or "",
            "department": u.department or "",
            "is_department_locked": u.is_department_locked,
            "needs_password_change": u.needs_password_change
        } for u in users
    ]

@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        if user.username == "admin":
            raise HTTPException(status_code=400, detail="Cannot delete default admin account")
        if user.username == current_user["sub"]:
            raise HTTPException(status_code=400, detail="Cannot delete your own active admin account")
        
        from ..models import ThinkingProfile, Response, Session, Assignment, AssignmentRequest
        
        # Delete assignments where this user is the teacher
        db.query(Assignment).filter(Assignment.teacher_id == user.id).delete()
        db.query(AssignmentRequest).filter(AssignmentRequest.teacher_id == user.id).delete()
        
        if user.student_profile:
            # Delete related profiles, responses, sessions, assignments for student
            db.query(ThinkingProfile).filter(ThinkingProfile.student_id == user.student_profile.id).delete()
            db.query(Response).filter(Response.student_id == user.student_profile.id).delete()
            db.query(Session).filter(Session.student_id == user.student_profile.id).delete()
            db.query(Assignment).filter(Assignment.student_id == user.student_profile.id).delete()
            db.query(AssignmentRequest).filter(AssignmentRequest.student_id == user.student_profile.id).delete()
            db.delete(user.student_profile)
        
        db.delete(user)
        db.commit()
        return {"message": "User deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        import logging
        logging.error(f"Error deleting user: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Database error deleting user: {str(e)}")

@router.get("/users/me")
def get_current_user_profile(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    user = db.query(User).filter(User.username == current_user["sub"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    student_id = user.student_profile.id if user.student_profile else None
    return {
        "id": user.id,
        "username": user.username,
        "role": user.role.value,
        "display_name": user.display_name or user.username,
        "bio": user.bio or "Cognitive evolution traveler in TVT.",
        "avatar_url": user.avatar_url or "",
        "student_id": student_id,
        "needs_password_change": user.needs_password_change,
        "department": user.department or "",
        "is_department_locked": user.is_department_locked
    }

class ProfileUpdate(BaseModel):
    display_name: str | None = None
    bio: str | None = None
    avatar_url: str | None = None
    department: str | None = None

@router.put("/users/me")
def update_user_profile(req: ProfileUpdate, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    user = db.query(User).filter(User.username == current_user["sub"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if req.display_name is not None:
        user.display_name = req.display_name
        if user.student_profile:
            user.student_profile.name = req.display_name
    if req.bio is not None:
        user.bio = req.bio
    if req.avatar_url is not None:
        user.avatar_url = req.avatar_url
    
    if req.department is not None:
        # Check if the user is an admin
        requesting_user = db.query(User).filter(User.username == current_user["sub"]).first()
        if requesting_user.role == UserRole.admin:
            user.department = req.department
            user.is_department_locked = True
        else:
            # If department is already locked and they try to change to something else, block it
            if user.is_department_locked and user.department and user.department != req.department:
                raise HTTPException(status_code=400, detail="Department is locked and cannot be changed without Administrator privileges.")
            if req.department:
                user.department = req.department
                user.is_department_locked = True

    db.commit()
    db.refresh(user)
    return {"message": "Profile updated successfully"}

class FirstLoginChangeRequest(BaseModel):
    display_name: str
    new_password: str
    department: str | None = None

@router.post("/change-password-first-login")
def change_password_first_login(req: FirstLoginChangeRequest, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    user = db.query(User).filter(User.username == current_user["sub"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.hashed_password = get_password_hash(req.new_password)
    user.display_name = req.display_name
    user.needs_password_change = False
    
    if req.department:
        user.department = req.department
        user.is_department_locked = True
        
    if user.student_profile:
        user.student_profile.name = req.display_name
        
    db.commit()
    return {"message": "Credentials updated successfully"}


# ─── Admin-only user management endpoints ────────────────────────────────────

class AdminEditUserRequest(BaseModel):
    display_name: str | None = None
    department: str | None = None
    role: UserRole | None = None

@router.put("/users/{user_id}")
def admin_edit_user(user_id: int, req: AdminEditUserRequest, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Admin-only: Edit a user's display name, department, or role."""
    requesting_user = db.query(User).filter(User.username == current_user["sub"]).first()
    if not requesting_user or requesting_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if req.display_name is not None:
        user.display_name = req.display_name
        if user.student_profile:
            user.student_profile.name = req.display_name
    if req.department is not None:
        user.department = req.department
        user.is_department_locked = True if req.department else False
    if req.role is not None:
        user.role = req.role
    db.commit()
    db.refresh(user)
    return {"message": "User updated successfully", "user_id": user_id}


class AdminResetPasswordRequest(BaseModel):
    new_password: str

@router.post("/users/{user_id}/reset-password")
def admin_reset_password(user_id: int, req: AdminResetPasswordRequest, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Admin-only: Reset a user's password and force change on next login."""
    requesting_user = db.query(User).filter(User.username == current_user["sub"]).first()
    if not requesting_user or requesting_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.hashed_password = get_password_hash(req.new_password)
    user.needs_password_change = True
    db.commit()
    return {"message": "Password reset. User will be prompted to change on next login."}


@router.get("/stats/system")
def get_system_stats(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Admin-only: System-wide stats."""
    requesting_user = db.query(User).filter(User.username == current_user["sub"]).first()
    if not requesting_user or requesting_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    from ..models import Response, Assignment, ThinkingProfile
    total_users = db.query(User).count()
    total_students = db.query(Student).count()
    total_faculty = db.query(User).filter(User.role == UserRole.faculty).count()
    total_responses = db.query(Response).count()
    total_assignments = db.query(Assignment).count()
    total_profiles = db.query(ThinkingProfile).count()
    return {
        "total_users": total_users,
        "total_students": total_students,
        "total_faculty": total_faculty,
        "total_responses": total_responses,
        "total_assignments": total_assignments,
        "total_thinking_profiles": total_profiles
    }
