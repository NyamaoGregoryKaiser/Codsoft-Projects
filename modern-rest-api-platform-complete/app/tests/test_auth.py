import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.crud.user import user as crud_user
from app.schemas.user import UserCreate

@pytest.mark.asyncio
async def test_register_user(client: AsyncClient, db_session: AsyncSession):
    """Test user registration."""
    user_data = {"email": "newuser@example.com", "password": "securepassword"}
    response = await client.post(f"{settings.API_V1_STR}/auth/register", json=user_data)
    
    assert response.status_code == 201
    created_user = response.json()
    assert created_user["email"] == user_data["email"]
    assert "id" in created_user
    assert created_user["is_active"] is True
    assert created_user["is_admin"] is False # Default should be false

    # Verify user actually in DB
    user_in_db = await crud_user.get_by_email(db_session, email=user_data["email"])
    assert user_in_db is not None
    assert user_in_db.email == user_data["email"]

@pytest.mark.asyncio
async def test_register_existing_user(client: AsyncClient, regular_user, db_session: AsyncSession):
    """Test registering with an already existing email."""
    user_data = {"email": regular_user.email, "password": "anotherpassword"}
    response = await client.post(f"{settings.API_V1_STR}/auth/register", json=user_data)
    
    assert response.status_code == 409
    assert response.json()["detail"] == "The user with this email already exists."

@pytest.mark.asyncio
async def test_login_for_access_token(client: AsyncClient, regular_user):
    """Test successful user login."""
    response = await client.post(
        f"{settings.API_V1_STR}/auth/login",
        data={"username": regular_user.email, "password": "testpassword"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    assert response.status_code == 200
    token_data = response.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"

@pytest.mark.asyncio
async def test_login_invalid_credentials(client: AsyncClient):
    """Test login with invalid password."""
    response = await client.post(
        f"{settings.API_V1_STR}/auth/login",
        data={"username": "nonexistent@example.com", "password": "wrongpassword"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect email or password"

@pytest.mark.asyncio
async def test_read_current_user(client: AsyncClient, regular_user, auth_regular_user_headers):
    """Test retrieving current authenticated user's details."""
    response = await client.get(
        f"{settings.API_V1_STR}/auth/me",
        headers=auth_regular_user_headers
    )
    assert response.status_code == 200
    user_data = response.json()
    assert user_data["email"] == regular_user.email
    assert user_data["id"] == regular_user.id

@pytest.mark.asyncio
async def test_read_current_user_unauthorized(client: AsyncClient):
    """Test retrieving current user without authentication."""
    response = await client.get(f"{settings.API_V1_STR}/auth/me")
    assert response.status_code == 401
    assert response.json()["detail"] == "Not authenticated"

@pytest.mark.asyncio
async def test_update_current_user(client: AsyncClient, regular_user, auth_regular_user_headers, db_session: AsyncSession):
    """Test updating current authenticated user's details."""
    update_data = {"email": "updated_user@example.com", "password": "newpassword"}
    response = await client.put(
        f"{settings.API_V1_STR}/auth/me",
        json=update_data,
        headers=auth_regular_user_headers
    )
    assert response.status_code == 200
    updated_user_data = response.json()
    assert updated_user_data["email"] == update_data["email"]

    # Verify password change
    logged_in_response = await client.post(
        f"{settings.API_V1_STR}/auth/login",
        data={"username": updated_user_data["email"], "password": "newpassword"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    assert logged_in_response.status_code == 200

    # Verify old credentials no longer work
    old_login_response = await client.post(
        f"{settings.API_V1_STR}/auth/login",
        data={"username": regular_user.email, "password": "testpassword"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    assert old_login_response.status_code == 401
```