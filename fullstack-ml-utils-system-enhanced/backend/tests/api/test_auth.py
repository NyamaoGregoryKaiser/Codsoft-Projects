```python
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from backend.core.config import settings
from backend.models import User
from backend.core.security import get_password_hash

def test_register_user_success(client: TestClient, db_session: Session):
    response = client.post(
        f"{settings.API_V1_STR}/auth/register",
        json={"email": "newuser@test.com", "password": "newpassword123"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newuser@test.com"
    assert "id" in data
    assert "is_active" in data
    assert "is_superuser" in data
    assert db_session.query(User).filter(User.email == "newuser@test.com").first() is not None

def test_register_user_already_exists(client: TestClient, test_user: User):
    response = client.post(
        f"{settings.API_V1_STR}/auth/register",
        json={"email": test_user.email, "password": "anypassword"}
    )
    assert response.status_code == 409
    assert response.json()["detail"] == "User with this email already exists."

def test_login_for_access_token_success(client: TestClient, test_user: User):
    response = client.post(
        f"{settings.API_V1_STR}/auth/token",
        data={"username": test_user.email, "password": "testpassword"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_login_for_access_token_invalid_password(client: TestClient, test_user: User):
    response = client.post(
        f"{settings.API_V1_STR}/auth/token",
        data={"username": test_user.email, "password": "wrongpassword"}
    )
    assert response.status_code == 403
    assert response.json()["detail"] == "Incorrect email or password"

def test_login_for_access_token_user_not_found(client: TestClient):
    response = client.post(
        f"{settings.API_V1_STR}/auth/token",
        data={"username": "nonexistent@test.com", "password": "anypassword"}
    )
    assert response.status_code == 403
    assert response.json()["detail"] == "Incorrect email or password"

def test_read_users_me_success(client: TestClient, test_user: User, auth_token: str):
    response = client.get(
        f"{settings.API_V1_STR}/auth/me",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == test_user.email
    assert data["id"] == test_user.id

def test_read_users_me_unauthorized(client: TestClient):
    response = client.get(
        f"{settings.API_V1_STR}/auth/me",
        headers={"Authorization": "Bearer invalid_token"}
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Could not validate credentials"
```