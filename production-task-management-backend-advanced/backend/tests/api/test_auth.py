import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.core import security
from app.core.config import settings
from app.db.models import User
from app.crud.user import user as crud_user

@pytest.mark.asyncio
async def test_login_access_token(client: AsyncClient, db_session: AsyncSession):
    email = "testuser_login@example.com"
    password = "testpassword"
    user_in = User(
        email=email,
        hashed_password=security.get_password_hash(password),
        full_name="Test Login User"
    )
    db_session.add(user_in)
    await db_session.commit()

    response = await client.post(
        f"{settings.API_V1_STR}/auth/login",
        data={"username": email, "password": password}
    )
    assert response.status_code == 200
    token_data = response.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"

@pytest.mark.asyncio
async def test_login_incorrect_password(client: AsyncClient, db_session: AsyncSession):
    email = "testuser_wrongpass@example.com"
    password = "correctpassword"
    user_in = User(
        email=email,
        hashed_password=security.get_password_hash(password),
        full_name="Wrong Pass User"
    )
    db_session.add(user_in)
    await db_session.commit()

    response = await client.post(
        f"{settings.API_V1_STR}/auth/login",
        data={"username": email, "password": "wrongpassword"}
    )
    assert response.status_code == 401
    assert "Incorrect email or password" in response.json()["detail"]

@pytest.mark.asyncio
async def test_login_non_existent_user(client: AsyncClient):
    response = await client.post(
        f"{settings.API_V1_STR}/auth/login",
        data={"username": "nonexistent@example.com", "password": "password"}
    )
    assert response.status_code == 401
    assert "Incorrect email or password" in response.json()["detail"]

@pytest.mark.asyncio
async def test_test_token(client: AsyncClient, superuser_token_headers: dict):
    response = await client.post(
        f"{settings.API_V1_STR}/auth/test-token",
        headers=superuser_token_headers
    )
    assert response.status_code == 200
    user_data = response.json()
    assert "email" in user_data
    assert user_data["email"] == settings.FIRST_SUPERUSER_EMAIL

@pytest.mark.asyncio
async def test_test_token_invalid_token(client: AsyncClient):
    response = await client.post(
        f"{settings.API_V1_STR}/auth/test-token",
        headers={"Authorization": "Bearer invalid_token"}
    )
    assert response.status_code == 401
    assert "Could not validate credentials" in response.json()["detail"]

@pytest.mark.asyncio
async def test_read_current_user(client: AsyncClient, normal_user_token_headers: tuple):
    headers, user = normal_user_token_headers
    response = await client.get(
        f"{settings.API_V1_STR}/auth/me",
        headers=headers
    )
    assert response.status_code == 200
    user_data = response.json()
    assert user_data["email"] == user.email
    assert user_data["id"] == user.id