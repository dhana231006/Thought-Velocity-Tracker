import os
import requests
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from ..database import get_db
from .. import models
from ..dependencies import get_current_user

router = APIRouter(prefix="/api/chat", tags=["chat"])

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

class ChatQueryRequest(BaseModel):
    message: str
    student_id: Optional[int] = None

@router.post("/query")
def chat_query(req: ChatQueryRequest, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    user = db.query(models.User).filter(models.User.username == current_user["sub"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Determine target student context
    target_student_id = req.student_id
    if not target_student_id and user.role == models.UserRole.student:
        if user.student_profile:
            target_student_id = user.student_profile.id

    context_str = ""
    if target_student_id:
        student = db.query(models.Student).filter(models.Student.id == target_student_id).first()
        if student:
            profiles = db.query(models.ThinkingProfile).filter(
                models.ThinkingProfile.student_id == student.id
            ).order_by(models.ThinkingProfile.timestamp).all()
            
            responses = db.query(models.Response).filter(
                models.Response.student_id == student.id
            ).all()

            context_str += f"\nStudent Name: {student.name} (ID: {student.id})\n"
            context_str += f"Total Submissions: {len(responses)}\n"
            
            if profiles:
                latest = profiles[-1]
                context_str += (
                    f"Latest 6D Thinking Profile Snapshot:\n"
                    f"- Semantic Depth: {latest.semantic_depth:.2f}\n"
                    f"- Abstraction Level: {latest.abstraction_level:.2f}\n"
                    f"- Reasoning Structure: {latest.reasoning_structure:.2f}\n"
                    f"- Cross Domain Links: {latest.cross_domain_links:.2f}\n"
                    f"- Confidence Pattern: {latest.confidence_pattern:.2f}\n"
                    f"- Vocabulary Expansion: {latest.vocabulary_expansion:.2f}\n"
                )
                context_str += f"Historical Trajectory Snapshots Count: {len(profiles)}\n"
            else:
                context_str += "No cognitive profiles recorded yet.\n"
    else:
        # General cohort info if teacher/admin looking at overview
        total_students = db.query(models.Student).count()
        total_responses = db.query(models.Response).count()
        context_str += f"TVT System Overview: {total_students} students enrolled, {total_responses} total responses analyzed."

    system_prompt = (
        "You are the Thought Velocity Tracker (TVT) AI Assistant. TVT is a longitudinal system that measures "
        "the rate and direction of cognitive evolution in students across 6 dimensions: Semantic Depth, Abstraction Level, "
        "Reasoning Structure, Cross-domain Links, Confidence Pattern, and Vocabulary Expansion.\n\n"
        "CRITICAL MANDATE: You MUST be strictly NON-EVALUATIVE. Never judge students as 'good', 'bad', 'smart', or 'dumb'. "
        "Focus strictly on direction of change, magnitude of thought velocity, trajectory trends, and structural depth.\n\n"
        "SCOPE MANDATE: You must ONLY answer questions related to the TVT system, such as student thinking profiles, "
        "growth trends, thought velocity, deceleration alerts, and cohort insights, grounded in the actual TVT data provided below. "
        "If a user asks about anything unrelated (e.g., general knowledge, coding, casual chat, non-TVT topics), you MUST politely decline "
        "and redirect them to ask about TVT data, even if you technically know the answer.\n\n"
        f"DATA CONTEXT FOR THIS SESSION:\n{context_str}\n\n"
        "Answer the user's question clearly, concisely, and insightfully based on TVT principles and the provided data."
    )

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": req.message}
        ],
        "temperature": 0.5,
        "max_tokens": 600
    }

    try:
        resp = requests.post(GROQ_API_URL, headers=headers, json=payload, timeout=15)
        if resp.status_code == 200:
            data = resp.json()
            reply = data["choices"][0]["message"]["content"]
            return {"reply": reply}
        else:
            return {"reply": f"Groq AI service error ({resp.status_code}): {resp.text}"}
    except Exception as e:
        return {"reply": f"Unable to reach Groq AI Chatbot endpoint: {str(e)}"}
