from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
import shutil
import uuid
import os
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, UserRole, ConcernRequest
from ..dependencies import get_current_user

router = APIRouter(prefix="/api/concerns", tags=["concerns"])

@router.post("/")
def create_concern(
    concern_type: str = Form(...),
    topic: str = Form(...),
    description: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user = db.query(User).filter(User.username == current_user["sub"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    ext = file.filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = f"backend/static/uploads/{filename}"
    os.makedirs("backend/static/uploads", exist_ok=True)
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    attachment_url = f"/static/uploads/{filename}"
    
    new_concern = ConcernRequest(
        user_id=user.id,
        concern_type=concern_type,
        topic=topic,
        description=description,
        attachment_url=attachment_url
    )
    db.add(new_concern)
    db.commit()
    db.refresh(new_concern)
    return {"message": "Concern submitted successfully", "concern_id": new_concern.id}

@router.get("/")
def list_concerns(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    user = db.query(User).filter(User.username == current_user["sub"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user.role == UserRole.admin:
        # Admin sees all pending
        concerns = db.query(ConcernRequest).order_by(ConcernRequest.timestamp.desc()).all()
    else:
        # User sees their own
        concerns = db.query(ConcernRequest).filter(ConcernRequest.user_id == user.id).order_by(ConcernRequest.timestamp.desc()).all()
        
    return [
        {
            "id": c.id,
            "username": c.user.username,
            "concern_type": c.concern_type,
            "topic": c.topic,
            "description": c.description,
            "attachment_url": c.attachment_url,
            "status": c.status,
            "admin_remarks": c.admin_remarks,
            "timestamp": c.timestamp
        } for c in concerns
    ]

@router.put("/{concern_id}")
def update_concern_status(
    concern_id: int,
    status: str = Form(...),
    remarks: str = Form(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    admin_user = db.query(User).filter(User.username == current_user["sub"]).first()
    if not admin_user or admin_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Admin access required")
        
    concern = db.query(ConcernRequest).filter(ConcernRequest.id == concern_id).first()
    if not concern:
        raise HTTPException(status_code=404, detail="Concern not found")
        
    concern.status = status
    concern.admin_remarks = remarks
    db.commit()
    
    return {"message": f"Concern {status}"}
