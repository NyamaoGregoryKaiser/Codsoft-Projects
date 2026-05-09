```python
import pytest
from httpx import AsyncClient
from app.core.config import settings
from datetime import datetime, timedelta, timezone

@pytest.mark.asyncio
async def test_register_user(client: AsyncClient):
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "newuser@example.com",
            "password": "testpassword",
            "first_name": "New",
            "last_name": "User"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newuser@example.com"
    assert "id" in data
    assert "hashed_password" not in data # Should not return hashed password

@pytest.mark.asyncio
async def test_register_existing_email(client: AsyncClient, test_user):
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": test_user.email, # Use existing email
            "password": "testpassword",
            "first_name": "Another",
            "last_name": "User"
        }
    )
    assert response.status_code == 401 # Unauthorized to prevent enumeration
    assert response.json()["detail"] == "Email already registered"

@pytest.mark.asyncio
async def test_login_user(client: AsyncClient, test_user):
    response = await client.post(
        "/api/v1/auth/login",
        data={"username": test_user.email, "password": "testpassword"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert "refresh_token" in response.cookies # Check for HttpOnly refresh token

@pytest.mark.asyncio
async def test_login_invalid_credentials(client: AsyncClient):
    response = await client.post(
        "/api/v1/auth/login",
        data={"username": "nonexistent@example.com", "password": "wrongpassword"}
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect email or password"

@pytest.mark.asyncio
async def test_login_inactive_user(client: AsyncClient, db_session, test_user):
    test_user.is_active = False
    db_session.add(test_user)
    await db_session.commit()
    await db_session.refresh(test_user)

    response = await client.post(
        "/api/v1/auth/login",
        data={"username": test_user.email, "password": "testpassword"}
    )
    assert response.status_code == 403
    assert response.json()["detail"] == "Inactive user"

@pytest.mark.asyncio
async def test_refresh_token(client: AsyncClient, test_user_headers):
    # The refresh token is in the cookie from test_user_headers
    response = await client.post(
        "/api/v1/auth/refresh-token",
        headers={"Cookie": test_user_headers["Cookie"]} # Only need the cookie here
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert "refresh_token" in response.cookies # New refresh token in cookie (rotation)
    
    # Verify new access token works
    new_access_token = data["access_token"]
    auth_headers = {"Authorization": f"Bearer {new_access_token}"}
    profile_response = await client.get("/api/v1/users/me", headers=auth_headers)
    assert profile_response.status_code == 200
    assert profile_response.json()["email"] == test_user_headers["email"] # Conftest fixture injects email

@pytest.mark.asyncio
async def test_refresh_token_no_cookie(client: AsyncClient):
    response = await client.post("/api/v1/auth/refresh-token")
    assert response.status_code == 401
    assert response.json()["detail"] == "Refresh token required"

@pytest.mark.asyncio
async def test_logout_user(client: AsyncClient, test_user_headers):
    response = await client.post(
        "/api/v1/auth/logout",
        headers=test_user_headers # Both auth header and cookie
    )
    assert response.status_code == 200
    assert response.json()["message"] == "Logged out successfully"
    assert "refresh_token" not in response.cookies # Cookie should be cleared

    # Attempt to use the old refresh token, should fail
    refresh_response = await client.post(
        "/api/v1/auth/refresh-token",
        headers={"Cookie": test_user_headers["Cookie"]}
    )
    assert refresh_response.status_code == 401
    assert refresh_response.json()["detail"] == "Refresh token revoked or expired"

@pytest.mark.asyncio
async def test_forgot_password(client: AsyncClient, test_user):
    response = await client.post(
        "/api/v1/auth/forgot-password",
        json={"email": test_user.email}
    )
    assert response.status_code == 200
    assert response.json()["message"] == "If an account with that email exists, a password reset link has been sent."

    # Verify that a reset token was created (in a real app, you'd check email)
    # For test purposes, we'll try to find it in the database
    from app.crud.user import get_password_reset_token_db
    from app.db.models import PasswordResetToken
    from sqlalchemy import select
    from app.db.session import TestingSessionLocal
    async with TestingSessionLocal() as session:
        result = await session.execute(
            select(PasswordResetToken).where(PasswordResetToken.user_id == test_user.id).order_by(PasswordResetToken.created_at.desc())
        )
        reset_token_db = result.scalar_one_or_none()
        assert reset_token_db is not None
        assert not reset_token_db.is_used
        assert reset_token_db.expires_at > datetime.now(timezone.utc)


@pytest.mark.asyncio
async def test_reset_password_valid_token(client: AsyncClient, db_session, test_user):
    # Manually create a password reset token for testing
    from app.core.security import create_access_token # Using JWT for reset tokens for simplicity, typically UUID.
    from datetime import timedelta
    from app.crud.user import create_password_reset_token_db
    
    reset_token_str = create_access_token({"sub": str(test_user.id), "reset_password": True}, expires_delta=timedelta(minutes=10))
    await create_password_reset_token_db(
        db_session, 
        test_user.id, 
        reset_token_str, 
        datetime.now(timezone.utc) + timedelta(minutes=10)
    )

    response = await client.post(
        "/api/v1/auth/reset-password",
        json={"token": reset_token_str, "new_password": "new_secure_password"}
    )
    assert response.status_code == 200
    assert response.json()["message"] == "Password has been successfully reset."

    # Try to log in with the new password
    login_response = await client.post(
        "/api/v1/auth/login",
        data={"username": test_user.email, "password": "new_secure_password"}
    )
    assert login_response.status_code == 200
    assert "access_token" in login_response.json()

    # Ensure the reset token is marked as used or invalidated
    from app.crud.user import get_password_reset_token_db
    reset_token_db = await get_password_reset_token_db(db_session, reset_token_str)
    assert reset_token_db.is_used

@pytest.mark.asyncio
async def test_reset_password_invalid_token(client: AsyncClient):
    response = await client.post(
        "/api/v1/auth/reset-password",
        json={"token": "invalid_token", "new_password": "new_secure_password"}
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid or expired token"

@pytest.mark.asyncio
async def test_reset_password_used_token(client: AsyncClient, db_session, test_user):
    # Manually create and use a password reset token
    from app.core.security import create_access_token
    from datetime import timedelta
    from app.crud.user import create_password_reset_token_db, mark_password_reset_token_used_db
    
    reset_token_str = create_access_token({"sub": str(test_user.id), "reset_password": True}, expires_delta=timedelta(minutes=10))
    db_reset_token = await create_password_reset_token_db(
        db_session, 
        test_user.id, 
        reset_token_str, 
        datetime.now(timezone.utc) + timedelta(minutes=10)
    )
    await mark_password_reset_token_used_db(db_session, db_reset_token.id) # Mark as used

    response = await client.post(
        "/api/v1/auth/reset-password",
        json={"token": reset_token_str, "new_password": "another_new_password"}
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid or expired token"

```