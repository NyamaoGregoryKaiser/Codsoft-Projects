```python
import pytest
from httpx import AsyncClient
from app.database.models import User, Merchant
from app.core.security import get_password_hash
from app.core.constants import UserRole
from sqlalchemy.ext.asyncio import AsyncSession

@pytest.mark.asyncio
async def test_create_merchant_user(test_client: AsyncClient, db_session: AsyncSession):
    response = await test_client.post(
        "/auth/register/merchant",
        json={"email": "new_merchant@example.com", "password": "securepassword", "merchant_name": "New Merchant Test"}
    )
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert data["email"] == "new_merchant@example.com"
    assert data["role"] == UserRole.MERCHANT.value

    # Verify merchant created
    merchant = await db_session.get(Merchant, data["id"]) # Assuming merchant ID is returned as data["id"]
    assert merchant is not None
    assert merchant.name == "New Merchant Test"

    # Test duplicate registration
    response = await test_client.post(
        "/auth/register/merchant",
        json={"email": "new_merchant@example.com", "password": "securepassword", "merchant_name": "New Merchant Test"}
    )
    assert response.status_code == 409 # Conflict

@pytest.mark.asyncio
async def test_login_for_access_token(test_client: AsyncClient, merchant_user: tuple[User, Merchant]):
    user, _ = merchant_user
    response = await test_client.post(
        "/auth/token",
        data={"username": user.email, "password": "merchantpassword"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

    # Test invalid credentials
    response = await test_client.post(
        "/auth/token",
        data={"username": user.email, "password": "wrongpassword"}
    )
    assert response.status_code == 401
    assert response.json() == {"detail": "Incorrect username or password"}
```