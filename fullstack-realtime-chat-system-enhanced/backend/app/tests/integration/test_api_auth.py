```python
import pytest
from httpx import AsyncClient
from fastapi import status

from app.core.config import settings

@pytest.mark.asyncio
async def test_register_new_user(client: AsyncClient, test_db_session):
    """
    Test user registration endpoint.
    """
    user_data = {
        "username": "newuser",
        "email": "newuser@example.com",
        "password": "strongpassword"
    }
    response = await client.post(f"{settings.API_V1_STR}/auth/register", json=user_data)
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert "id" in data
    assert data["username"] == "newuser"
    assert data["email"] == "newuser@example.com"
    assert "hashed_password" not in data # Hashed password should not be returned
    assert data["is_active"] is True
    assert data["is_admin"] is False

    # Check if user exists in DB
    from app.crud.user import user as crud_user
    db_user = await crud_user.get_by_email(test_db_session, email="newuser@example.com")
    assert db_user is not None
    assert db_user.username == "newuser"

@pytest.mark.asyncio
async def test_register_existing_email(client: AsyncClient, normal_user):
    """
    Test user registration with an email that already exists.
    """
    user_data = {
        "username": "anotheruser",
        "email": normal_user.email, # Use existing email
        "password": "strongpassword"
    }
    response = await client.post(f"{settings.API_V1_STR}/auth/register", json=user_data)
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "User with this email already exists" in response.json()["detail"]

@pytest.mark.asyncio
async def test_register_existing_username(client: AsyncClient, normal_user):
    """
    Test user registration with a username that already exists.
    """
    user_data = {
        "username": normal_user.username, # Use existing username
        "email": "another@example.com", 
        "password": "strongpassword"
    }
    response = await client.post(f"{settings.API_V1_STR}/auth/register", json=user_data)
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "User with this username already exists" in response.json()["detail"]


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient, normal_user):
    """
    Test successful user login and token generation.
    """
    form_data = {
        "username": normal_user.username,
        "password": "securepassword"
    }
    response = await client.post(
        f"{settings.API_V1_STR}/auth/login",
        data=form_data, # Use data= for form-urlencoded
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

@pytest.mark.asyncio
async def test_login_invalid_credentials(client: AsyncClient, normal_user):
    """
    Test login with incorrect username or password.
    """
    form_data = {
        "username": normal_user.username,
        "password": "wrongpassword"
    }
    response = await client.post(
        f"{settings.API_V1_STR}/auth/login",
        data=form_data,
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "Incorrect username or password" in response.json()["detail"]

    form_data_2 = {
        "username": "nonexistent",
        "password": "anypassword"
    }
    response_2 = await client.post(
        f"{settings.API_V1_STR}/auth/login",
        data=form_data_2,
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    assert response_2.status_code == status.HTTP_400_BAD_REQUEST
    assert "Incorrect username or password" in response_2.json()["detail"]

@pytest.mark.asyncio
async def test_login_inactive_user(client: AsyncClient, inactive_user):
    """
    Test login with an inactive user account.
    """
    form_data = {
        "username": inactive_user.username,
        "password": "securepassword"
    }
    response = await client.post(
        f"{settings.API_V1_STR}/auth/login",
        data=form_data,
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "Incorrect username or password" in response.json()["detail"] # Currently, it's generic error

@pytest.mark.asyncio
async def test_read_current_user_authenticated(client: AsyncClient, normal_user, normal_user_token):
    """
    Test retrieving current user information with a valid token.
    """
    response = await client.get(
        f"{settings.API_V1_STR}/auth/me",
        headers={"Authorization": f"Bearer {normal_user_token}"}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == normal_user.id
    assert data["username"] == normal_user.username
    assert data["email"] == normal_user.email
    assert "hashed_password" not in data

@pytest.mark.asyncio
async def test_read_current_user_unauthenticated(client: AsyncClient):
    """
    Test retrieving current user information without a token.
    """
    response = await client.get(f"{settings.API_V1_STR}/auth/me")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert "Not authenticated" in response.json()["detail"]

@pytest.mark.asyncio
async def test_read_current_user_invalid_token(client: AsyncClient):
    """
    Test retrieving current user information with an invalid token.
    """
    response = await client.get(
        f"{settings.API_V1_STR}/auth/me",
        headers={"Authorization": "Bearer invalid_token"}
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert "Could not validate credentials" in response.json()["detail"]

```