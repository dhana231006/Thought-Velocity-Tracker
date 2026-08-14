from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from . import models
from .database import engine, get_db
from .routers import responses, trajectories, assignments, auth, chat, concerns
from .auth import get_password_hash
import sys
import os

# Add parent directory to path so we can import from nlp_engine
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
try:
    from nlp_engine.api.routes import router as nlp_router
except ImportError:
    nlp_router = None

# Initialize DB tables (creates schema in PostgreSQL)
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Thought Velocity Tracker (TVT) API",
    description="Longitudinal AI system for measuring cognitive evolution trajectories.",
    version="1.0.0"
)

from fastapi.staticfiles import StaticFiles
# Create static directory if it doesn't exist
import os
os.makedirs("backend/static/avatars", exist_ok=True)
app.mount("/static", StaticFiles(directory="backend/static"), name="static")

@app.on_event("startup")
def bootstrap_admin():
    db = next(get_db())
    admin_user = db.query(models.User).filter(models.User.username == "admin").first()
    if not admin_user:
        new_admin = models.User(username="admin", hashed_password=get_password_hash("admin123"), role=models.UserRole.admin)
        db.add(new_admin)
        db.commit()

# CORS config to allow frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(responses.router)
app.include_router(trajectories.router)
app.include_router(assignments.router)
app.include_router(chat.router)
app.include_router(concerns.router)

if nlp_router:
    app.include_router(nlp_router, prefix="/api", tags=["nlp"])

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "tvt-backend"}
