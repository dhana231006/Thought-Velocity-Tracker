import os
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from sqlalchemy.orm import Session
from .database import get_db

security = HTTPBearer()

def verify_supabase_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    secret_keys = [
        os.getenv("JWT_SECRET_KEY", "super-secret-tvt-key-1234"),
        os.getenv("SUPABASE_JWT_SECRET", "super-secret-jwt-token-with-at-least-32-characters-long")
    ]
    
    for secret in secret_keys:
        try:
            decoded_token = jwt.decode(
                token,
                secret,
                algorithms=["HS256"],
                options={"verify_aud": False}
            )
            return decoded_token
        except jwt.PyJWTError:
            continue

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authentication token or credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

def get_current_user(token_payload: dict = Depends(verify_supabase_token)):
    user_id = token_payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    # Return user_id and role information under sub & id keys
    return {"sub": user_id, "id": user_id, "email": token_payload.get("email")}

def get_current_teacher(user: dict = Depends(get_current_user)):
    # In a real app we'd verify roles from DB or JWT claims
    return user

def get_current_student(user: dict = Depends(get_current_user)):
    return user
