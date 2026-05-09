```python
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.models import User
from app.schemas.user import UserCreate

def test_create_user_open(client: TestClient, db_session: Session, superuser_data: UserCreate):
    """Test user registration endpoint for non-superusers."""
    user_data = {
        "email": "newuser@example.com",
        "password": "newpassword",
        "full_name": "New Test User",
    }
    response = client.post(
        f"{settings.API_V1_STR}/register", json=user_data
    )
    assert response.status_code == 201
    assert response.json()["email"] == user_data["email"]

def test_create_existing_user_open(client: TestClient, db_session: Session, test_user: User):
    """Test registration with existing email."""
    user_data = {
        "email": test_user.email,
        "password": "anotherpassword",
        "full_name": "Another Name",
    }
    response = client.post(
        f"{settings.API_V1_STR}/register", json=user_data
    )
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]

def test_get_access_token(client: TestClient, test_user: User):
    login_data = {
        "username": test_user.email,
        "password": "testpassword",
    }
    response = client.post(
        f"{settings.API_V1_STR}/login/access-token", data=login_data
    )
    assert response.status_code == 200
    assert "access_token" in response.json()
    assert response.json()["token_type"] == "bearer"

def test_get_access_token_wrong_password(client: TestClient, test_user: User):
    login_data = {
        "username": test_user.email,
        "password": "wrongpassword",
    }
    response = client.post(
        f"{settings.API_V1_STR}/login/access-token", data=login_data
    )
    assert response.status_code == 401
    assert "Incorrect username or password" in response.json()["detail"]

def test_get_access_token_non_existent_user(client: TestClient):
    login_data = {
        "username": "nonexistent@example.com",
        "password": "password",
    }
    response = client.post(
        f"{settings.API_V1_STR}/login/access-token", data=login_data
    )
    assert response.status_code == 401
    assert "Incorrect username or password" in response.json()["detail"]

```