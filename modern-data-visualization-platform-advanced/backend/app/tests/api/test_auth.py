```python
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.schemas.user import UserCreate

@pytest.mark.asyncio
async def test_login_access_token(client: AsyncClient, db_session: AsyncSession):
    # Create a user first
    user_data = UserCreate(email="testlogin@example.com", password="TestPassword123!", full_name="Login User")
    await client.post(f"{settings.API_V1_STR}/register", json=user_data.model_dump())

    # Test login
    response = await client.post(
        f"{settings.API_V1_STR}/login/access-token",
        data={"username": user_data.email, "password": user_data.password},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    assert response.status_code == 200
    token_data = response.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"

@pytest.mark.asyncio
async def test_login_access_token_invalid_credentials(client: AsyncClient):
    response = await client.post(
        f"{settings.API_V1_STR}/login/access-token",
        data={"username": "nonexistent@example.com", "password": "WrongPassword"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Incorrect email or password"

@pytest.mark.asyncio
async def test_test_token(client: AsyncClient, normal_user_token_headers: dict):
    response = await client.post(f"{settings.API_V1_STR}/login/test-token", headers=normal_user_token_headers)
    assert response.status_code == 200
    user_data = response.json()
    assert "email" in user_data
    assert user_data["email"] == "normaluser@test.com"

@pytest.mark.asyncio
async def test_test_token_invalid(client: AsyncClient):
    response = await client.post(f"{settings.API_V1_STR}/login/test-token", headers={"Authorization": "Bearer invalidtoken"})
    assert response.status_code == 401
    assert response.json()["detail"] == "Could not validate credentials"

@pytest.mark.asyncio
async def test_register_user(client: AsyncClient):
    user_data = UserCreate(email="newuser@example.com", password="NewUserPassword1!", full_name="New Test User")
    response = await client.post(f"{settings.API_V1_STR}/register", json=user_data.model_dump())
    assert response.status_code == 201
    created_user = response.json()
    assert created_user["email"] == user_data.email
    assert created_user["is_superuser"] is False # Should default to False for registration
    assert "hashed_password" not in created_user # Hashed password should not be returned

@pytest.mark.asyncio
async def test_register_existing_user(client: AsyncClient):
    user_data = UserCreate(email="existing@example.com", password="ExistingUserPassword1!", full_name="Existing User")
    await client.post(f"{settings.API_V1_STR}/register", json=user_data.model_dump())
    
    response = await client.post(f"{settings.API_V1_STR}/register", json=user_data.model_dump())
    assert response.status_code == 400
    assert response.json()["detail"] == "The user with this username already exists in the system."

@pytest.mark.asyncio
async def test_register_superuser_attempt(client: AsyncClient):
    user_data = UserCreate(email="evil_admin@example.com", password="EvilPassword1!", full_name="Evil Admin", is_superuser=True)
    response = await client.post(f"{settings.API_V1_STR}/register", json=user_data.model_dump())
    assert response.status_code == 403
    assert "Unauthorized to register as a superuser" in response.json()["detail"]
```