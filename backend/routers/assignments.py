from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Assignment, User, Student, UserRole
from ..dependencies import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/api/assignments", tags=["assignments"])

class AssignmentCreate(BaseModel):
    topic: str
    student_id: int

@router.post("/")
def create_assignment(req: AssignmentCreate, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    user = db.query(User).filter(User.username == current_user["sub"]).first()
    
    assignment = Assignment(
        teacher_id=user.id,
        student_id=req.student_id,
        topic=req.topic,
        status="pending"
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment

@router.get("/students")
def get_all_students(db: Session = Depends(get_db)):
    students = db.query(Student).all()
    return [{"id": s.id, "name": s.name} for s in students]

@router.get("/students-by-dept")
def get_students_by_dept(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    user = db.query(User).filter(User.username == current_user["sub"]).first()
    if not user or not user.department:
        return []
    
    students = db.query(Student).join(User, Student.user_id == User.id).filter(
        User.role == UserRole.student,
        User.department == user.department
    ).all()
    
    return [{"id": s.id, "name": s.name, "department": user.department} for s in students]

@router.get("/other-dept-students")
def get_other_dept_students(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    user = db.query(User).filter(User.username == current_user["sub"]).first()
    if not user:
        return []
    
    students = db.query(Student).join(User, Student.user_id == User.id).filter(
        User.role == UserRole.student,
        User.department != user.department
    ).all()
    
    return [{"id": s.id, "name": s.name, "department": s.user.department or "None"} for s in students]

class AssignmentRequestCreate(BaseModel):
    student_id: int
    topic: str

@router.post("/request")
def create_assignment_request(req: AssignmentRequestCreate, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    user = db.query(User).filter(User.username == current_user["sub"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    student = db.query(Student).filter(Student.id == req.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    from ..models import AssignmentRequest
    new_req = AssignmentRequest(
        teacher_id=user.id,
        student_id=req.student_id,
        topic=req.topic,
        status="pending"
    )
    db.add(new_req)
    db.commit()
    db.refresh(new_req)
    return {"message": "Request submitted to admin successfully", "request_id": new_req.id}

@router.get("/requests/pending")
def get_pending_requests(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    user = db.query(User).filter(User.username == current_user["sub"]).first()
    if not user or user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    from ..models import AssignmentRequest
    reqs = db.query(AssignmentRequest).filter(AssignmentRequest.status == "pending").all()
    return [
        {
            "id": r.id,
            "teacher_username": r.teacher.username,
            "teacher_display_name": r.teacher.display_name or r.teacher.username,
            "teacher_dept": r.teacher.department or "None",
            "student_id": r.student_id,
            "student_name": r.student.name,
            "student_dept": r.student.user.department or "None",
            "topic": r.topic,
            "status": r.status,
            "timestamp": r.timestamp.isoformat()
        } for r in reqs
    ]

@router.post("/requests/{request_id}/approve")
def approve_request(request_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    user = db.query(User).filter(User.username == current_user["sub"]).first()
    if not user or user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    from ..models import AssignmentRequest, Assignment
    req = db.query(AssignmentRequest).filter(AssignmentRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    
    req.status = "approved"
    
    assignment = Assignment(
        teacher_id=req.teacher_id,
        student_id=req.student_id,
        topic=req.topic,
        status="pending"
    )
    db.add(assignment)
    db.commit()
    return {"message": "Request approved and assignment created."}

@router.post("/requests/{request_id}/reject")
def reject_request(request_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    user = db.query(User).filter(User.username == current_user["sub"]).first()
    if not user or user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    from ..models import AssignmentRequest
    req = db.query(AssignmentRequest).filter(AssignmentRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    
    req.status = "rejected"
    db.commit()
    return {"message": "Request rejected successfully."}

@router.get("/requests/teacher")
def get_teacher_requests(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    user = db.query(User).filter(User.username == current_user["sub"]).first()
    if not user:
        return []
    
    from ..models import AssignmentRequest
    reqs = db.query(AssignmentRequest).filter(AssignmentRequest.teacher_id == user.id).all()
    return [
        {
            "id": r.id,
            "student_id": r.student_id,
            "student_name": r.student.name,
            "topic": r.topic,
            "status": r.status,
            "timestamp": r.timestamp.isoformat()
        } for r in reqs
    ]

@router.get("/student")
def get_student_assignments(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    user = db.query(User).filter(User.username == current_user["sub"]).first()
    student = db.query(Student).filter(Student.user_id == user.id).first()
    if not student:
        return []
    
    assignments = db.query(Assignment).filter(Assignment.student_id == student.id).all()
    res_list = []
    for a in assignments:
        teacher = db.query(User).filter(User.id == a.teacher_id).first()
        teacher_name = teacher.display_name or teacher.username if teacher else "System"
        res_list.append({
            "id": a.id,
            "topic": a.topic,
            "status": a.status,
            "teacher_id": a.teacher_id,
            "teacher_name": teacher_name
        })
    return res_list

@router.get("/teacher")
def get_teacher_assignments(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    user = db.query(User).filter(User.username == current_user["sub"]).first()
    
    assignments = db.query(Assignment).filter(Assignment.teacher_id == user.id).all()
    res = []
    for a in assignments:
        student = db.query(Student).filter(Student.id == a.student_id).first()
        student_name = student.name if student else f"Student #{a.student_id}"
        res.append({
            "id": a.id,
            "topic": a.topic,
            "status": a.status,
            "student_id": a.student_id,
            "student_name": student_name
        })
    return res
