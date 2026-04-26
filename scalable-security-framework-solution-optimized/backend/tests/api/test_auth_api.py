```python
import pytest
from httpx import AsyncClient
from app.core.config import settings
from datetime import datetime, timedelta
from jose import jwt

@pytest.mark.asyncio
async def test_register_user_success(client: AsyncClient):
    """Test successful user registration."""
    response = await client.post(
        "/api/v1/auth/register",
        json={"email": "register@example.com", "password": "securepassword", "full_name": "Test User"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "register@example.com"
    assert "id" in data
    assert "hashed_password" not in data # Should not return hashed password

@pytest.mark.asyncio
async def test_register_existing_email(client: AsyncClient, test_regular_user):
    """Test registration with an already existing email."""
    response = await client.post(
        "/api/v1/auth/register",
        json={"email": test_regular_user.email, "password": "newpassword"}
    )
    assert response.status_code == 409 # Conflict
    assert "Email already registered" in response.json()["detail"]

@pytest.mark.asyncio
async def test_register_as_admin_fails(client: AsyncClient):
    """Test attempting to register with admin role (should default to user)."""
    response = await client.post(
        "/api/v1/auth/register",
        json={"email": "adminattempt@example.com", "password": "securepassword", "role": "admin"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "adminattempt@example.com"
    assert data["role"] == "user" # Should be changed to 'user'

@pytest.mark.asyncio
async def test_login_success(client: AsyncClient, test_regular_user):
    """Test successful user login."""
    response = await client.post(
        "/api/v1/auth/login",
        data={"username": test_regular_user.email, "password": "userpassword"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"

@pytest.mark.asyncio
async def test_login_invalid_credentials(client: AsyncClient):
    """Test login with incorrect username or password."""
    response = await client.post(
        "/api/v1/auth/login",
        data={"username": "wrong@example.com", "password": "wrongpassword"}
    )
    assert response.status_code == 401
    assert "Incorrect username or password" in response.json()["detail"]

@pytest.mark.asyncio
async def test_login_inactive_user(client: AsyncClient, db_session, create_another_user):
    """Test login for an inactive user."""
    inactive_user = create_another_user(email="inactive@example.com", password="inactivepassword", is_active=False)
    response = await client.post(
        "/api/v1/auth/login",
        data={"username": inactive_user.email, "password": "inactivepassword"}
    )
    assert response.status_code == 401
    assert "Inactive user" in response.json()["detail"]

@pytest.mark.asyncio
async def test_refresh_token_success(client: AsyncClient, test_regular_user):
    """Test refreshing an access token using a refresh token."""
    login_response = await client.post(
        "/api/v1/auth/login",
        data={"username": test_regular_user.email, "password": "userpassword"}
    )
    assert login_response.status_code == 200
    tokens = login_response.json()
    refresh_token = tokens["refresh_token"]

    refresh_response = await client.post(
        "/api/v1/auth/refresh",
        headers={"Authorization": f"Bearer {refresh_token}"}
    )
    assert refresh_response.status_code == 200
    new_tokens = refresh_response.json()
    assert "access_token" in new_tokens
    assert new_tokens["refresh_token"] == refresh_token # Our implementation returns the same refresh token

    # Verify the new access token is valid
    from app.core.security import decode_token
    decoded_access = decode_token(new_tokens["access_token"])
    assert decoded_access is not None
    assert decoded_access["sub"] == str(test_regular_user.id)
    assert decoded_access["type"] == "access"

@pytest.mark.asyncio
async def test_refresh_token_with_invalid_token(client: AsyncClient):
    """Test refreshing with an invalid or expired refresh token."""
    response = await client.post(
        "/api/v1/auth/refresh",
        headers={"Authorization": "Bearer invalid.refresh.token"}
    )
    assert response.status_code == 401
    assert "Invalid refresh token" in response.json()["detail"]

@pytest.mark.asyncio
async def test_refresh_token_with_access_token_instead_of_refresh(client: AsyncClient, regular_user_token_headers):
    """Test refreshing using an access token instead of a refresh token."""
    access_token = regular_user_token_headers["Authorization"].split(" ")[1]
    response = await client.post(
        "/api/v1/auth/refresh",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    assert response.status_code == 401
    assert "Invalid token type, expected refresh token" in response.json()["detail"]

@pytest.mark.asyncio
async def test_logout_success(client: AsyncClient, regular_user_token_headers):
    """Test user logout (client-side token discard)."""
    response = await client.post(
        "/api/v1/auth/logout",
        headers=regular_user_token_headers
    )
    assert response.status_code == 200
    assert "Successfully logged out" in response.json()["message"]

    # After logout, accessing a protected endpoint should fail
    protected_response = await client.get("/api/v1/users/me", headers=regular_user_token_headers)
    assert protected_response.status_code == 401 # Unauthorized
```