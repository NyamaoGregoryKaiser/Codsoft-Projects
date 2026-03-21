import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas.user import UserRegister, UserBase
from app.schemas.base import Token
from app.crud.user import user as crud_user
from app.core.config import settings
from app.core.security import decode_token

@pytest.mark.asyncio
async def test_register_user(client: AsyncClient, db_session: AsyncSession):
    register_data = {"email": "register@test.com", "password": "securepassword"}
    response = await client.post("/api/v1/auth/register", json=register_data)
    
    assert response.status_code == 201
    user_data = response.json()
    assert user_data["email"] == "register@test.com"
    assert "id" in user_data
    assert "is_active" in user_data
    assert user_data["is_active"] is True
    assert "is_admin" in user_data
    assert user_data["is_admin"] is False

    # Verify user is in database
    db_user = await crud_user.get_by_email(db_session, "register@test.com")
    assert db_user is not None
    assert db_user.email == "register@test.com"
    assert db_user.is_active is True
    assert db_user.is_admin is False

@pytest.mark.asyncio
async def test_register_existing_user(client: AsyncClient, regular_user: User):
    register_data = {"email": regular_user.email, "password": "newpassword"}
    response = await client.post("/api/v1/auth/register", json=register_data)
    
    assert response.status_code == 400
    assert "Email already registered" in response.json()["detail"]

@pytest.mark.asyncio
async def test_login_for_access_token(client: AsyncClient, regular_user: User):
    form_data = {"username": regular_user.email, "password": "testpassword"}
    response = await client.post("/api/v1/auth/token", data=form_data)
    
    assert response.status_code == 200
    token_data = response.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"
    
    # Check if refresh token cookie is set
    assert "refresh_token" in response.cookies
    assert response.cookies["refresh_token"] is not None

    # Verify token payload
    payload = decode_token(token_data["access_token"])
    assert payload["user_id"] == regular_user.id
    assert payload["email"] == regular_user.email
    assert payload["is_admin"] == regular_user.is_admin
    assert payload["sub"] == "access"

@pytest.mark.asyncio
async def test_login_invalid_credentials(client: AsyncClient):
    form_data = {"username": "nonexistent@test.com", "password": "wrongpassword"}
    response = await client.post("/api/v1/auth/token", data=form_data)
    
    assert response.status_code == 401
    assert "Incorrect email or password" in response.json()["detail"]

@pytest.mark.asyncio
async def test_refresh_token(client: AsyncClient, regular_user: User):
    # First, login to get a refresh token
    login_data = {"username": regular_user.email, "password": "testpassword"}
    login_response = await client.post("/api/v1/auth/token", data=login_data)
    assert login_response.status_code == 200
    
    # Extract refresh token from cookie
    refresh_token = login_response.cookies["refresh_token"]
    
    # Simulate a request with the refresh token cookie
    response = await client.post("/api/v1/auth/refresh", cookies={"refresh_token": refresh_token})
    assert response.status_code == 200
    
    token_data = response.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"
    assert "refresh_token" in response.cookies # New refresh token should be set

    # Verify new access token payload
    payload = decode_token(token_data["access_token"])
    assert payload["user_id"] == regular_user.id
    assert payload["sub"] == "access"

@pytest.mark.asyncio
async def test_refresh_token_missing_cookie(client: AsyncClient):
    response = await client.post("/api/v1/auth/refresh") # No cookie sent
    assert response.status_code == 401
    assert "Refresh token missing" in response.json()["detail"]

@pytest.mark.asyncio
async def test_logout(client: AsyncClient, regular_user_token: str):
    # Simulate having a refresh token cookie
    client.cookies.set("refresh_token", "dummy_refresh_token_value")
    
    response = await client.post("/api/v1/auth/logout")
    
    assert response.status_code == 200
    assert "Logged out successfully" in response.json()["message"]
    
    # Verify that the refresh_token cookie is deleted
    assert "refresh_token" in response.cookies
    assert response.cookies["refresh_token"] == "" # Expired/deleted
    
    # Check max-age / expires headers for cookie deletion
    set_cookie_header = response.headers.get_list("set-cookie")[0]
    assert "Max-Age=0" in set_cookie_header or "expires=Thu, 01 Jan 1970" in set_cookie_header.lower()