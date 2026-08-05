import pytest
from fastapi.testclient import TestClient
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend.main import app
from backend.database import get_db
from backend.dependencies import get_current_user
from backend import models

client = TestClient(app)

# Mocked users
STUDENT_A = {"sub": "student_a", "id": 1, "role": models.UserRole.student}
STUDENT_B = {"sub": "student_b", "id": 2, "role": models.UserRole.student}
FACULTY_A = {"sub": "faculty_a", "id": 3, "role": models.UserRole.faculty}

# Mocking the get_current_user dependency dynamically
def override_get_current_user_factory(mock_user_data):
    def override_get_current_user():
        return mock_user_data
    return override_get_current_user

# Mock DB Session
class MockSession:
    def __init__(self, current_user_data):
        self.current_user_data = current_user_data
        
    def query(self, model):
        return MockQuery(model, self.current_user_data)
        
    def add(self, instance):
        pass
        
    def flush(self):
        pass
        
    def commit(self):
        pass

class MockQuery:
    def __init__(self, model, current_user_data):
        self.model = model
        self.current_user_data = current_user_data
        
    def filter(self, condition):
        return self
        
    def first(self):
        if self.model == models.User:
            user = models.User(id=self.current_user_data["id"], username=self.current_user_data["sub"], role=self.current_user_data["role"])
            return user
        elif self.model == models.Student:
            # Always return a student that belongs to STUDENT_A (user_id=1)
            # This allows us to test if STUDENT_B gets rejected
            return models.Student(id=10, user_id=1, name="Alice")
        return None
        
    def all(self):
        return []

def get_mock_db_factory(mock_user_data):
    def override_get_db():
        yield MockSession(mock_user_data)
    return override_get_db

def test_student_cannot_submit_response_for_another_student():
    # Authenticate as STUDENT_B (id=2), but target student belongs to STUDENT_A (user_id=1)
    app.dependency_overrides[get_current_user] = override_get_current_user_factory(STUDENT_B)
    app.dependency_overrides[get_db] = get_mock_db_factory(STUDENT_B)
    
    response = client.post("/api/responses", json={
        "student_id": 10,
        "text": "This is a test response"
    })
    
    assert response.status_code == 403
    assert "Not authorized" in response.json()["detail"]
    
def test_student_cannot_view_another_student_profile():
    # Authenticate as STUDENT_B (id=2), but target student belongs to STUDENT_A (user_id=1)
    app.dependency_overrides[get_current_user] = override_get_current_user_factory(STUDENT_B)
    app.dependency_overrides[get_db] = get_mock_db_factory(STUDENT_B)
    
    response = client.get("/api/students/10/profile")
    
    assert response.status_code == 403
    assert "Not authorized" in response.json()["detail"]

def test_student_cannot_view_faculty_alerts():
    # Authenticate as STUDENT_A (id=1, role=student)
    app.dependency_overrides[get_current_user] = override_get_current_user_factory(STUDENT_A)
    app.dependency_overrides[get_db] = get_mock_db_factory(STUDENT_A)
    
    response = client.get("/api/faculty/alerts")
    
    assert response.status_code == 403
    assert "Only faculty or admins can view alerts" in response.json()["detail"]
    
def test_faculty_can_view_alerts():
    # Authenticate as FACULTY_A (id=3, role=faculty)
    app.dependency_overrides[get_current_user] = override_get_current_user_factory(FACULTY_A)
    app.dependency_overrides[get_db] = get_mock_db_factory(FACULTY_A)
    
    response = client.get("/api/faculty/alerts")
    
    assert response.status_code == 200
