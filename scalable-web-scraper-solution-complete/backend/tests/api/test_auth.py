import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.crud.user import user as crud_user
from app.models.user import UserRole

@pytest.mark.asyncio
async def test_register_user(client: AsyncClient, db_session: AsyncSession):
    response = await client.post(
        "/api/v1/auth/register",
        json={"email": "test@example.com", "password": "securepassword123"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@example.com"
    assert "id" in data
    assert data["is_active"] is True
    assert data["role"] == UserRole.USER.value

    # Verify user is in DB
    db_user = await crud_user.get_by_email(db_session, email="test@example.com")
    assert db_user is not None
    assert db_user.email == "test@example.com"
    assert db_user.role == UserRole.USER

@pytest.mark.asyncio
async def test_register_user_duplicate_email(client: AsyncClient, db_session: AsyncSession, create_user):
    await create_user("duplicate@example.com", "password")
    response = await client.post(
        "/api/v1/auth/register",
        json={"email": "duplicate@example.com", "password": "newpassword"}
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Email already registered"

@pytest.mark.asyncio
async def test_login_for_access_token(client: AsyncClient, db_session: AsyncSession, create_user):
    await create_user("login@example.com", "loginpassword")
    response = await client.post(
        "/api/v1/auth/token",
        data={"username": "login@example.com", "password": "loginpassword"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert "expires_in" in data

@pytest.mark.asyncio
async def test_login_for_access_token_invalid_credentials(client: AsyncClient):
    response = await client.post(
        "/api/v1/auth/token",
        data={"username": "nonexistent@example.com", "password": "wrongpassword"}
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect username or password"

@pytest.mark.asyncio
async def test_login_for_access_token_inactive_user(client: AsyncClient, db_session: AsyncSession, create_user):
    inactive_user = await create_user("inactive@example.com", "password")
    inactive_user.is_active = False
    db_session.add(inactive_user)
    await db_session.commit()
    await db_session.refresh(inactive_user)

    response = await client.post(
        "/api/v1/auth/token",
        data={"username": "inactive@example.com", "password": "password"}
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Inactive user"

```