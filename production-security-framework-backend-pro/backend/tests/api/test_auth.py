```python
import pytest
from httpx import AsyncClient
from app.core.config import settings
from app.schemas.user import UserCreate
from app.schemas.token import TokenData
from app.core.security import verify_token
from datetime import datetime, timezone

@pytest.mark.asyncio
async def test_register_user_success(client: AsyncClient):
    response = await client.post(
        "/api/v1/auth/register",
        json={"email": "register@example.com", "password": "supersecretpassword", "full_name": "Registered User"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "register@example.com"
    assert "id" in data
    assert "hashed_password" not in data

@pytest.mark.asyncio
async def test_register_user_email_exists(client: AsyncClient, test_user):
    response = await client.post(
        "/api/v1/auth/register",
        json={"email": test_user.email, "password": "supersecretpassword", "full_name": "Duplicate User"}
    )
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]

@pytest.mark.asyncio
async def test_login_success(client: AsyncClient, test_user):
    response = await client.post(
        "/api/v1/auth/login",
        data={"username": test_user.email, "password": "testpassword123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"

    # Verify access token
    token_data = verify_token(data["access_token"], token_type="access")
    assert token_data.user_id == test_user.id
    assert token_data.email == test_user.email
    assert token_data.role == test_user.role

    # Verify refresh token
    refresh_token_data = verify_token(data["refresh_token"], token_type="refresh")
    assert refresh_token_data.user_id == test_user.id
    assert refresh_token_data.email == test_user.email
    assert refresh_token_data.role == test_user.role

@pytest.mark.asyncio
async def test_login_invalid_credentials(client: AsyncClient):
    response = await client.post(
        "/api/v1/auth/login",
        data={"username": "wrong@example.com", "password": "wrongpassword"}
    )
    assert response.status_code == 401
    assert "Incorrect username or password" in response.json()["detail"]

@pytest.mark.asyncio
async def test_refresh_token_success(client: AsyncClient, get_test_refresh_token: str, test_user):
    response = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": get_test_refresh_token}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    
    new_token_data = verify_token(data["access_token"], token_type="access")
    assert new_token_data.user_id == test_user.id

@pytest.mark.asyncio
async def test_refresh_token_invalid_type(client: AsyncClient, get_test_access_token: str):
    response = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": get_test_access_token} # Passing an access token as refresh
    )
    assert response.status_code == 401
    assert "Invalid token type. Expected 'refresh'" in response.json()["detail"]

@pytest.mark.asyncio
async def test_logout_success(authorized_client: AsyncClient, get_test_access_token: str):
    response = await authorized_client.post(
        "/api/v1/auth/logout"
    )
    assert response.status_code == 200
    assert response.json()["message"] == "Successfully logged out"

    # Verify the token is now blocked
    headers = {"Authorization": f"Bearer {get_test_access_token}"}
    response_after_logout = await authorized_client.get("/api/v1/users/me", headers=headers)
    assert response_after_logout.status_code == 401
    assert "Token has been revoked or logged out" in response_after_logout.json()["detail"]
```