import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.schemas.user import UserCreate

@pytest.mark.asyncio
async def test_create_new_user(client: AsyncClient, db_session: AsyncSession):
    user_data = {
        "username": "newuser",
        "email": "newuser@example.com",
        "password": "password123",
    }
    response = await client.post(f"{settings.API_V1_STR}/auth/register", json=user_data)
    assert response.status_code == 201
    created_user = response.json()
    assert created_user["email"] == user_data["email"]
    assert created_user["username"] == user_data["username"]
    assert "id" in created_user
    assert "hashed_password" not in created_user # Should not expose hashed password

@pytest.mark.asyncio
async def test_create_existing_user_email(client: AsyncClient, create_user):
    await create_user(email="existing@example.com", username="existinguser")
    user_data = {
        "username": "anotheruser",
        "email": "existing@example.com",
        "password": "password123",
    }
    response = await client.post(f"{settings.API_V1_STR}/auth/register", json=user_data)
    assert response.status_code == 409 # Conflict
    assert "EMAIL_ALREADY_EXISTS" in response.json()["code"]

@pytest.mark.asyncio
async def test_create_existing_user_username(client: AsyncClient, create_user):
    await create_user(username="existinguser", email="another@example.com")
    user_data = {
        "username": "existinguser",
        "email": "newunique@example.com",
        "password": "password123",
    }
    response = await client.post(f"{settings.API_V1_STR}/auth/register", json=user_data)
    assert response.status_code == 409 # Conflict
    assert "USERNAME_ALREADY_EXISTS" in response.json()["code"]

@pytest.mark.asyncio
async def test_login_for_access_token(client: AsyncClient, create_user):
    user = await create_user(email="login@example.com", password="securepassword")
    response = await client.post(
        f"{settings.API_V1_STR}/auth/login",
        data={"username": user.email, "password": "securepassword"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert response.status_code == 200
    token_data = response.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"

@pytest.mark.asyncio
async def test_login_invalid_credentials(client: AsyncClient, create_user):
    await create_user(email="wrong@example.com", password="password")
    response = await client.post(
        f"{settings.API_V1_STR}/auth/login",
        data={"username": "wrong@example.com", "password": "wrongpassword"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert response.status_code == 400
    assert "Incorrect email or password" in response.json()["message"]

@pytest.mark.asyncio
async def test_login_inactive_user(client: AsyncClient, create_user):
    user = await create_user(email="inactive@example.com", password="password", is_active=False)
    response = await client.post(
        f"{settings.API_V1_STR}/auth/login",
        data={"username": user.email, "password": "password"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert response.status_code == 403 # Forbidden (Inactive user caught by get_current_user logic)
    assert "Inactive user" in response.json()["message"]

@pytest.mark.asyncio
async def test_read_current_user(client: AsyncClient, regular_user_token_headers):
    response = await client.get(
        f"{settings.API_V1_STR}/auth/me",
        headers=regular_user_token_headers,
    )
    assert response.status_code == 200
    user_data = response.json()
    assert user_data["email"] == "test@example.com" # Default email from fixture
    assert user_data["username"] == "testuser"
    assert user_data["is_active"] is True
    assert user_data["is_superuser"] is False

@pytest.mark.asyncio
async def test_read_current_user_no_token(client: AsyncClient):
    response = await client.get(f"{settings.API_V1_STR}/auth/me")
    assert response.status_code == 401
    assert "Not authenticated" in response.json()["message"]

@pytest.mark.asyncio
async def test_test_token(client: AsyncClient, superuser_token_headers):
    response = await client.post(
        f"{settings.API_V1_STR}/auth/test-token",
        headers=superuser_token_headers
    )
    assert response.status_code == 200
    user_data = response.json()
    assert user_data["email"] == settings.FIRST_SUPERUSER_EMAIL
    assert user_data["is_superuser"] is True