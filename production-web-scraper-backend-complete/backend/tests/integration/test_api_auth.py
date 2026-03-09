import pytest
from httpx import AsyncClient
from app.schemas.user import UserCreate

@pytest.mark.asyncio
async def test_login_success(client: AsyncClient, test_user_data: UserCreate):
    # Ensure user exists for login
    await client.post(
        "/api/v1/auth/register",
        json={"email": test_user_data.email, "password": test_user_data.password},
    )

    response = await client.post(
        "/api/v1/auth/login",
        data={"username": test_user_data.email, "password": test_user_data.password},
    )
    assert response.status_code == 200
    assert "access_token" in response.json()
    assert response.json()["token_type"] == "bearer"

@pytest.mark.asyncio
async def test_login_invalid_credentials(client: AsyncClient):
    response = await client.post(
        "/api/v1/auth/login",
        data={"username": "nonexistent@example.com", "password": "wrongpassword"},
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect email or password"

@pytest.mark.asyncio
async def test_register_user_success(client: AsyncClient):
    user_data = {"email": "newuser@example.com", "password": "newpassword"}
    response = await client.post(
        "/api/v1/auth/register",
        json=user_data,
    )
    assert response.status_code == 201
    assert response.json()["email"] == user_data["email"]
    assert response.json()["is_active"] is True
    assert response.json()["is_superuser"] is False

@pytest.mark.asyncio
async def test_register_user_already_exists(client: AsyncClient, test_user_data: UserCreate):
    # Register once
    await client.post(
        "/api/v1/auth/register",
        json={"email": test_user_data.email, "password": test_user_data.password},
    )
    # Try to register again with same email
    response = await client.post(
        "/api/v1/auth/register",
        json={"email": test_user_data.email, "password": "anotherpassword"},
    )
    assert response.status_code == 409
    assert "already exists" in response.json()["detail"]

@pytest.mark.asyncio
async def test_get_current_user(client: AsyncClient, auth_headers: dict, test_user_data: UserCreate):
    response = await client.get(
        "/api/v1/auth/me",
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["email"] == test_user_data.email
```
---