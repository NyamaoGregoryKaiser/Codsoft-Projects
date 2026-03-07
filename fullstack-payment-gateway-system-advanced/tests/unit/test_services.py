```python
import pytest
from unittest.mock import AsyncMock, patch
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.auth_service import AuthService
from app.core.exceptions import UnauthorizedException
from app.database.models import User
from app.core.security import get_password_hash
from app.schemas.auth import UserCreate, Token
from app.core.constants import UserRole

@pytest.mark.asyncio
async def test_create_user(db_session: AsyncSession):
    auth_service = AuthService(db_session)
    user_data = UserCreate(email="newuser@example.com", password="password123", role=UserRole.MERCHANT)
    user = await auth_service.create_user(user_data)

    assert user.email == "newuser@example.com"
    assert user.role == UserRole.MERCHANT
    assert auth_service.verify_password("password123", user.hashed_password)

    # Test conflict
    with pytest.raises(Exception): # Replace with specific ConflictException from your core/exceptions
        await auth_service.create_user(user_data)

@pytest.mark.asyncio
async def test_authenticate_user(db_session: AsyncSession):
    auth_service = AuthService(db_session)
    hashed_password = get_password_hash("testpassword")
    user = User(email="authuser@example.com", hashed_password=hashed_password, role=UserRole.MERCHANT)
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    # Test valid authentication
    authenticated_user = await auth_service.authenticate_user("authuser@example.com", "testpassword")
    assert authenticated_user.id == user.id

    # Test invalid password
    with pytest.raises(UnauthorizedException):
        await auth_service.authenticate_user("authuser@example.com", "wrongpassword")

    # Test non-existent user
    with pytest.raises(UnauthorizedException):
        await auth_service.authenticate_user("nonexistent@example.com", "anypassword")

@pytest.mark.asyncio
async def test_create_access_token():
    auth_service = AuthService(AsyncMock()) # Mock db_session as it's not used here
    data = {"sub": "testuser@example.com", "user_id": 1, "role": "merchant"}
    token = auth_service.create_access_token(data)
    assert isinstance(token, Token)
    assert "access_token" in token.model_dump()
    assert token.token_type == "bearer"

    # You would typically decode and verify the token here, but that's handled by get_current_user dependency.
```