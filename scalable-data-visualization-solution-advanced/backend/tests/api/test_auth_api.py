```python
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.schemas.user import UserCreate
from app.crud.users import crud_user

@pytest.mark.asyncio
async def test_register_user(client: AsyncClient, db_session: AsyncSession):
    response = await client.post(
        f"{settings.API_V1_STR}/auth/register",
        json={"email": "newuser@example.com", "password": "newpassword123", "full_name": "New User"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newuser@example.com"
    assert data["full_name"] == "New User"
    assert "id" in data
    assert not data["is_superuser"]

    # Verify user exists in DB
    user = await crud_user.get_by_email(db_session, email="newuser@example.com")
    assert user is not None
    assert user.full_name == "New User"

@pytest.mark.asyncio
async def test_register_existing_user_fails(client: AsyncClient, db_session: AsyncSession):
    # Register once
    await client.post(
        f"{settings.API_V1_STR}/auth/register",
        json={"email": "existing@example.com", "password": "password", "full_name": "Existing User"}
    )
    # Try to register again with same email
    response = await client.post(
        f"{settings.API_V1_STR}/auth/register",
        json={"email": "existing@example.com", "password": "anotherpassword"}
    )
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]

@pytest.mark.asyncio
async def test_login_superuser_success(client: AsyncClient):
    response = await client.post(
        f"{settings.API_V1_STR}/auth/login",
        data={"username": settings.FIRST_SUPERUSER_EMAIL, "password": settings.FIRST_SUPERUSER_PASSWORD}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

    # Check cookies
    assert "access_token" in response.cookies
    assert "refresh_token" in response.cookies

@pytest.mark.asyncio
async def test_login_bad_credentials(client: AsyncClient):
    response = await client.post(
        f"{settings.API_V1_STR}/auth/login",
        data={"username": settings.FIRST_SUPERUSER_EMAIL, "password": "wrongpassword"}
    )
    assert response.status_code == 400
    assert "Incorrect email or password" in response.json()["detail"]

    response = await client.post(
        f"{settings.API_V1_STR}/auth/login",
        data={"username": "nonexistent@example.com", "password": "password"}
    )
    assert response.status_code == 400
    assert "Incorrect email or password" in response.json()["detail"]

@pytest.mark.asyncio
async def test_get_current_user(client: AsyncClient, superuser_token_headers: dict):
    response = await client.get(
        f"{settings.API_V1_STR}/auth/me",
        headers=superuser_token_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == settings.FIRST_SUPERUSER_EMAIL
    assert data["is_superuser"] is True
    assert data["is_active"] is True

@pytest.mark.asyncio
async def test_get_current_user_unauthorized(client: AsyncClient):
    response = await client.get(
        f"{settings.API_V1_STR}/auth/me",
        headers={"Authorization": "Bearer invalidtoken"}
    )
    assert response.status_code == 401
    assert "Could not validate credentials" in response.json()["detail"]

@pytest.mark.asyncio
async def test_logout(client: AsyncClient, superuser_token_headers: dict):
    # First, log in to ensure cookies are set
    login_response = await client.post(
        f"{settings.API_V1_STR}/auth/login",
        data={"username": settings.FIRST_SUPERUSER_EMAIL, "password": settings.FIRST_SUPERUSER_PASSWORD}
    )
    assert login_response.status_code == 200
    # The client instance in fixture automatically carries cookies from previous requests within the same fixture scope
    # However, for a clean logout test, we need to explicitly send the logout request.
    # The `superuser_token_headers` fixture also creates a login, so just use that.

    response = await client.post(
        f"{settings.API_V1_STR}/auth/logout",
        headers=superuser_token_headers # Headers are not strictly needed for logout if using cookies
    )
    assert response.status_code == 200
    assert response.json() == {"message": "Logged out successfully"}

    # Verify cookies are cleared. This is typically done by checking 'set-cookie' headers
    # to see if max-age is 0 or expires is in the past.
    assert 'access_token=; Max-Age=0;' in response.headers.get('set-cookie', '')
    assert 'refresh_token=; Max-Age=0;' in response.headers.get('set-cookie', '')

    # Try accessing a protected route after logout (should fail)
    response_after_logout = await client.get(
        f"{settings.API_V1_STR}/auth/me",
        headers=superuser_token_headers # Should still fail because the cookies (the actual auth) are cleared
    )
    assert response_after_logout.status_code == 401
```