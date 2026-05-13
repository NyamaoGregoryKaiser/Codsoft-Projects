import pytest
from httpx import AsyncClient
from fastapi import status

from app.core.config import settings

@pytest.mark.asyncio
async def test_register_user(client: AsyncClient):
    """Test user registration."""
    user_data = {
        "email": "newuser@example.com",
        "password": "testpassword123",
        "full_name": "New User",
        "role": "merchant"
    }
    response = await client.post(f"{settings.API_V1_STR}/auth/register", json=user_data)
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["email"] == user_data["email"]
    assert "hashed_password" not in data # Hashed password should not be returned
    assert data["role"] == user_data["role"]

@pytest.mark.asyncio
async def test_register_existing_user(client: AsyncClient, create_user):
    """Test registering a user with an already existing email."""
    existing_email = "existing@example.com"
    await create_user(email=existing_email, password="testpassword")
    
    user_data = {
        "email": existing_email,
        "password": "anotherpassword",
        "full_name": "Another User",
        "role": "customer_portal"
    }
    response = await client.post(f"{settings.API_V1_STR}/auth/register", json=user_data)
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "already exists" in response.json()["detail"]

@pytest.mark.asyncio
async def test_login_access_token(client: AsyncClient, create_user):
    """Test successful user login and token generation."""
    email = "loginuser@example.com"
    password = "loginpassword"
    await create_user(email=email, password=password)

    form_data = {
        "username": email,
        "password": password,
        "grant_type": "password",
        "scope": ""
    }
    response = await client.post(f"{settings.API_V1_STR}/auth/login/access-token", data=form_data)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

@pytest.mark.asyncio
async def test_login_invalid_credentials(client: AsyncClient):
    """Test login with incorrect credentials."""
    form_data = {
        "username": "nonexistent@example.com",
        "password": "wrongpassword",
        "grant_type": "password",
        "scope": ""
    }
    response = await client.post(f"{settings.API_V1_STR}/auth/login/access-token", data=form_data)
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "Incorrect email or password" in response.json()["detail"]

@pytest.mark.asyncio
async def test_read_current_user_authenticated(client: AsyncClient, merchant_user_token_headers: dict):
    """Test retrieving current user details with valid token."""
    response = await client.get(f"{settings.API_V1_STR}/auth/me", headers=merchant_user_token_headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["email"] == "merchant@test.com"
    assert "hashed_password" not in data
    assert "merchant" in data # Merchant user should have merchant data included
    assert data["merchant"]["name"] == "Test Merchant Inc."

@pytest.mark.asyncio
async def test_read_current_user_unauthenticated(client: AsyncClient):
    """Test retrieving current user details without a token."""
    response = await client.get(f"{settings.API_V1_STR}/auth/me")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert "Not authenticated" in response.json()["detail"]

```

#### `payment_processor/tests/api/test_transactions_api.py`
```python