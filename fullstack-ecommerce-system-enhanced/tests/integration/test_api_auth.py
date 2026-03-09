```python
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.crud.crud_user import get_user_by_email
from app.schemas.user import UserCreate
from app.core.config import settings

@pytest.mark.asyncio
async def test_register_user(client: AsyncClient, db_session: AsyncSession):
    user_data = {
        "email": "register@example.com",
        "password": "securepassword",
        "first_name": "Reg",
        "last_name": "User",
        "is_admin": False
    }
    response = await client.post("/api/v1/auth/register", json=user_data)
    
    assert response.status_code == 201
    created_user = response.json()
    assert created_user["email"] == user_data["email"]
    assert "hashed_password" not in created_user
    assert created_user["is_active"] is True
    assert created_user["is_admin"] is False

    # Verify user in database
    user_db = await get_user_by_email(db_session, user_data["email"])
    assert user_db is not None
    assert user_db.email == user_data["email"]

@pytest.mark.asyncio
async def test_register_user_duplicate_email(client: AsyncClient, db_session: AsyncSession):
    user_data = {
        "email": "duplicate@example.com",
        "password": "securepassword"
    }
    await client.post("/api/v1/auth/register", json=user_data) # First registration

    response = await client.post("/api/v1/auth/register", json=user_data) # Second registration
    assert response.status_code == 409
    assert "Email already registered" in response.json()["detail"]

@pytest.mark.asyncio
async def test_login_for_access_token_success(client: AsyncClient, seeded_db_session: AsyncSession):
    response = await client.post(
        "/api/v1/auth/token",
        data={"username": settings.ADMIN_EMAIL, "password": settings.ADMIN_PASSWORD},
    )
    assert response.status_code == 200
    token_data = response.json()
    assert "access_token" in token_data
    assert "refresh_token" in token_data
    assert token_data["token_type"] == "bearer"

@pytest.mark.asyncio
async def test_login_for_access_token_invalid_credentials(client: AsyncClient, seeded_db_session: AsyncSession):
    response = await client.post(
        "/api/v1/auth/token",
        data={"username": settings.ADMIN_EMAIL, "password": "wrongpassword"},
    )
    assert response.status_code == 401
    assert "Incorrect username or password" in response.json()["detail"]

    response = await client.post(
        "/api/v1/auth/token",
        data={"username": "nonexistent@example.com", "password": "anypassword"},
    )
    assert response.status_code == 401
    assert "Incorrect username or password" in response.json()["detail"]

@pytest.mark.asyncio
async def test_read_users_me_success(client: AsyncClient, admin_token_headers: dict):
    response = await client.get("/api/v1/auth/me", headers=admin_token_headers)
    assert response.status_code == 200
    user_data = response.json()
    assert user_data["email"] == settings.ADMIN_EMAIL
    assert user_data["is_admin"] is True

@pytest.mark.asyncio
async def test_read_users_me_unauthorized(client: AsyncClient):
    response = await client.get("/api/v1/auth/me") # No token
    assert response.status_code == 401
    assert "Could not validate credentials" in response.json()["detail"]

    response = await client.get("/api/v1/auth/me", headers={"Authorization": "Bearer invalidtoken"})
    assert response.status_code == 401
    assert "Could not validate credentials" in response.json()["detail"]

@pytest.mark.asyncio
async def test_refresh_token_success(client: AsyncClient, regular_user_token_headers: dict):
    # The `regular_user_token_headers` fixture already provides an access token
    # We will use this token to simulate a refresh-token request.
    # In a real scenario, the client would send the *refresh token* to this endpoint.
    # For simplicity of testing dependency, we send the access token to get a new pair.
    # The `get_current_user` dependency (used by refresh-token endpoint) validates any token.

    response = await client.post("/api/v1/auth/refresh-token", headers=regular_user_token_headers)
    assert response.status_code == 200
    token_data = response.json()
    assert "access_token" in token_data
    assert "refresh_token" in token_data
    assert token_data["token_type"] == "bearer"
    assert token_data["access_token"] != regular_user_token_headers["Authorization"].split(" ")[1] # Should be new token

@pytest.mark.asyncio
async def test_refresh_token_unauthorized(client: AsyncClient):
    response = await client.post("/api/v1/auth/refresh-token")
    assert response.status_code == 401
```