import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta, UTC
import asyncio

from app.core.config import settings
from app.crud.users import user_crud
from app.crud.roles import role_crud
from app.crud.tokens import email_verify_token_crud
from app.schemas.user import UserCreate, UserLogin, ForgotPasswordRequest, ResetPasswordRequest, VerifyEmailRequest, TokenRefresh
from app.services.auth import auth_service
from app.core.security import get_password_hash, decode_token
import redis.asyncio as redis

@pytest.mark.asyncio
async def test_register_user(client: AsyncClient, db_session: AsyncSession):
    """
    Test user registration endpoint.
    """
    # Ensure default 'user' role exists
    await role_crud.create_role(db_session, {"name": "user", "description": "Default user role"})
    await db_session.commit()

    response = await client.post(
        f"{settings.API_V1_STR}/auth/register",
        json={"email": "test@example.com", "password": "TestPassword123", "full_name": "Test User"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@example.com"
    assert "id" in data
    assert not data["is_verified"]
    assert any(role["name"] == "user" for role in data["roles"])

    user = await user_crud.get_by_email(db_session, "test@example.com")
    assert user is not None
    assert user.email == "test@example.com"
    assert user.full_name == "Test User"
    assert user.is_active
    assert not user.is_verified # Should be false initially

@pytest.mark.asyncio
async def test_register_existing_email(client: AsyncClient, db_session: AsyncSession):
    """
    Test registering with an email that already exists.
    """
    # Create a user first
    await role_crud.create_role(db_session, {"name": "user", "description": "Default user role"})
    await auth_service.register_user(db_session, UserCreate(email="existing@example.com", password="Password123", full_name="Existing User"))

    response = await client.post(
        f"{settings.API_V1_STR}/auth/register",
        json={"email": "existing@example.com", "password": "NewPassword123", "full_name": "Another User"}
    )
    assert response.status_code == 400
    assert response.json()["message"] == "Email already registered"

@pytest.mark.asyncio
async def test_verify_email(client: AsyncClient, db_session: AsyncSession):
    """
    Test email verification endpoint.
    """
    await role_crud.create_role(db_session, {"name": "user", "description": "Default user role"})
    user = await auth_service.register_user(db_session, UserCreate(email="verify@example.com", password="Password123", full_name="Verify User"))
    assert not user.is_verified

    # Get the verification token from the database
    token_obj = (await email_verify_token_crud.get_multi(db_session))[0] # Assuming only one token
    assert token_obj is not None

    response = await client.post(
        f"{settings.API_V1_STR}/auth/verify-email",
        json={"token": token_obj.token}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "verify@example.com"
    assert data["is_verified"]

    # Try to verify again with the same token
    response = await client.post(
        f"{settings.API_V1_STR}/auth/verify-email",
        json={"token": token_obj.token}
    )
    assert response.status_code == 400
    assert response.json()["message"] == "Invalid or expired verification token" # Token is now used/invalidated

@pytest.mark.asyncio
async def test_login_user(client: AsyncClient, db_session: AsyncSession):
    """
    Test user login endpoint.
    """
    # Create and verify a user first
    await role_crud.create_role(db_session, {"name": "user", "description": "Default user role"})
    user = await auth_service.register_user(db_session, UserCreate(email="login@example.com", password="Password123", full_name="Login User"))
    user.is_verified = True
    await db_session.commit()
    await db_session.refresh(user)

    response = await client.post(
        f"{settings.API_V1_STR}/auth/login",
        json={"email": "login@example.com", "password": "Password123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "login@example.com"
    assert data["user"]["is_verified"]

@pytest.mark.asyncio
async def test_login_inactive_user(client: AsyncClient, db_session: AsyncSession):
    """
    Test login with an inactive user.
    """
    # Create and verify a user, then deactivate
    await role_crud.create_role(db_session, {"name": "user", "description": "Default user role"})
    user = await auth_service.register_user(db_session, UserCreate(email="inactive@example.com", password="Password123", full_name="Inactive User"))
    user.is_verified = True
    user.is_active = False
    await db_session.commit()
    await db_session.refresh(user)

    response = await client.post(
        f"{settings.API_V1_STR}/auth/login",
        json={"email": "inactive@example.com", "password": "Password123"}
    )
    assert response.status_code == 403
    assert response.json()["message"] == "User account is inactive"

@pytest.mark.asyncio
async def test_login_unverified_user(client: AsyncClient, db_session: AsyncSession):
    """
    Test login with an unverified user.
    """
    # Create an unverified user
    await role_crud.create_role(db_session, {"name": "user", "description": "Default user role"})
    await auth_service.register_user(db_session, UserCreate(email="unverified@example.com", password="Password123", full_name="Unverified User"))

    response = await client.post(
        f"{settings.API_V1_STR}/auth/login",
        json={"email": "unverified@example.com", "password": "Password123"}
    )
    assert response.status_code == 403
    assert response.json()["message"] == "Email not verified. Please verify your email to log in."


@pytest.mark.asyncio
async def test_login_incorrect_password(client: AsyncClient):
    """
    Test login with incorrect password.
    """
    response = await client.post(
        f"{settings.API_V1_STR}/auth/login",
        json={"email": "test@example.com", "password": "WrongPassword"}
    )
    assert response.status_code == 401
    assert response.json()["message"] == "Incorrect email or password"

@pytest.mark.asyncio
async def test_refresh_token(client: AsyncClient, db_session: AsyncSession, redis_client: redis.Redis):
    """
    Test token refresh endpoint.
    """
    # Create and verify a user
    await role_crud.create_role(db_session, {"name": "user", "description": "Default user role"})
    user = await auth_service.register_user(db_session, UserCreate(email="refresh@example.com", password="Password123", full_name="Refresh User"))
    user.is_verified = True
    await db_session.commit()
    await db_session.refresh(user)

    login_response = await client.post(
        f"{settings.API_V1_STR}/auth/login",
        json={"email": "refresh@example.com", "password": "Password123"}
    )
    original_refresh_token = login_response.json()["refresh_token"]

    response = await client.post(
        f"{settings.API_V1_STR}/auth/refresh-token",
        json={"refresh_token": original_refresh_token}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["refresh_token"] != original_refresh_token # Refresh token should rotate

    # Original refresh token should now be blacklisted
    assert await redis_client.get(f"blacklist:{original_refresh_token}") is not None

    # Try to use the original refresh token again
    response = await client.post(
        f"{settings.API_V1_STR}/auth/refresh-token",
        json={"refresh_token": original_refresh_token}
    )
    assert response.status_code == 401
    assert response.json()["message"] == "Refresh token has been revoked"

@pytest.mark.asyncio
async def test_logout_user(client: AsyncClient, db_session: AsyncSession, redis_client: redis.Redis):
    """
    Test user logout endpoint.
    """
    # Create and verify a user
    await role_crud.create_role(db_session, {"name": "user", "description": "Default user role"})
    user = await auth_service.register_user(db_session, UserCreate(email="logout@example.com", password="Password123", full_name="Logout User"))
    user.is_verified = True
    await db_session.commit()
    await db_session.refresh(user)

    login_response = await client.post(
        f"{settings.API_V1_STR}/auth/login",
        json={"email": "logout@example.com", "password": "Password123"}
    )
    access_token = login_response.json()["access_token"]
    refresh_token = login_response.json()["refresh_token"]

    response = await client.post(
        f"{settings.API_V1_STR}/auth/logout",
        headers={"Authorization": f"Bearer {access_token}"},
        json={"refresh_token": refresh_token}
    )
    assert response.status_code == 200
    assert response.json()["message"] == "Logged out successfully"

    # Verify refresh token is blacklisted
    assert await redis_client.get(f"blacklist:{refresh_token}") is not None

    # Try to use the refresh token again
    response = await client.post(
        f"{settings.API_V1_STR}/auth/refresh-token",
        json={"refresh_token": refresh_token}
    )
    assert response.status_code == 401
    assert response.json()["message"] == "Refresh token has been revoked"

@pytest.mark.asyncio
async def test_forgot_password(client: AsyncClient, db_session: AsyncSession):
    """
    Test forgot password request.
    """
    # Create a user
    await role_crud.create_role(db_session, {"name": "user", "description": "Default user role"})
    await auth_service.register_user(db_session, UserCreate(email="forgot@example.com", password="Password123", full_name="Forgot User"))

    response = await client.post(
        f"{settings.API_V1_STR}/auth/forgot-password",
        json={"email": "forgot@example.com"}
    )
    assert response.status_code == 200
    assert response.json()["message"] == "If an account with that email exists, a password reset link has been sent."

    # Verify a token was created in the database
    user = await user_crud.get_by_email(db_session, "forgot@example.com")
    assert user.password_reset_tokens is not None
    assert len(user.password_reset_tokens) == 1

@pytest.mark.asyncio
async def test_reset_password(client: AsyncClient, db_session: AsyncSession):
    """
    Test password reset with a valid token.
    """
    # Create a user
    await role_crud.create_role(db_session, {"name": "user", "description": "Default user role"})
    user_create = UserCreate(email="reset@example.com", password="OldPassword123", full_name="Reset User")
    user = await auth_service.register_user(db_session, user_create)
    user.is_verified = True
    await db_session.commit()
    await db_session.refresh(user)

    # Manually create a password reset token
    token_str = "some-reset-token-uuid"
    expires_at = datetime.now(UTC) + timedelta(hours=1)
    await auth_service.pwd_reset_token_crud.create_token(db_session, {
        "token": token_str,
        "user_id": user.id,
        "expires_at": expires_at
    })
    await db_session.commit()

    response = await client.post(
        f"{settings.API_V1_STR}/auth/reset-password",
        json={"token": token_str, "new_password": "NewPassword123"}
    )
    assert response.status_code == 200
    assert response.json()["message"] == "Password has been reset successfully."

    # Try to log in with the new password
    login_response = await client.post(
        f"{settings.API_V1_STR}/auth/login",
        json={"email": "reset@example.com", "password": "NewPassword123"}
    )
    assert login_response.status_code == 200
    assert "access_token" in login_response.json()

    # Old password should no longer work
    login_response_old = await client.post(
        f"{settings.API_V1_STR}/auth/login",
        json={"email": "reset@example.com", "password": "OldPassword123"}
    )
    assert login_response_old.status_code == 401

    # Token should be invalidated
    invalidated_token = await auth_service.pwd_reset_token_crud.get_by_token(db_session, token_str)
    assert invalidated_token is None

@pytest.mark.asyncio
async def test_reset_password_invalid_token(client: AsyncClient):
    """
    Test password reset with an invalid token.
    """
    response = await client.post(
        f"{settings.API_V1_STR}/auth/reset-password",
        json={"token": "invalid-token", "new_password": "NewPassword123"}
    )
    assert response.status_code == 400
    assert response.json()["message"] == "Invalid or expired password reset token"

@pytest.mark.asyncio
async def test_read_current_user_profile(client: AsyncClient, db_session: AsyncSession):
    """
    Test getting current user's profile.
    """
    # Create and login a user
    await role_crud.create_role(db_session, {"name": "user", "description": "Default user role"})
    user_data = UserCreate(email="profile@example.com", password="ProfilePassword123", full_name="Profile User")
    user = await auth_service.register_user(db_session, user_data)
    user.is_verified = True
    await db_session.commit()
    await db_session.refresh(user)

    login_response = await client.post(
        f"{settings.API_V1_STR}/auth/login",
        json={"email": "profile@example.com", "password": "ProfilePassword123"}
    )
    access_token = login_response.json()["access_token"]

    response = await client.get(
        f"{settings.API_V1_STR}/users/me",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "profile@example.com"
    assert data["full_name"] == "Profile User"
    assert "id" in data
    assert "roles" in data
    assert any(role["name"] == "user" for role in data["roles"])

@pytest.mark.asyncio
async def test_update_current_user_profile(client: AsyncClient, db_session: AsyncSession):
    """
    Test updating current user's profile.
    """
    # Create and login a user
    await role_crud.create_role(db_session, {"name": "user", "description": "Default user role"})
    user_data = UserCreate(email="update@example.com", password="UpdatePassword123", full_name="Update User")
    user = await auth_service.register_user(db_session, user_data)
    user.is_verified = True
    await db_session.commit()
    await db_session.refresh(user)

    login_response = await client.post(
        f"{settings.API_V1_STR}/auth/login",
        json={"email": "update@example.com", "password": "UpdatePassword123"}
    )
    access_token = login_response.json()["access_token"]

    update_payload = {"full_name": "Updated Name"}
    response = await client.put(
        f"{settings.API_V1_STR}/users/me",
        headers={"Authorization": f"Bearer {access_token}"},
        json=update_payload
    )
    assert response.status_code == 200
    data = response.json()
    assert data["full_name"] == "Updated Name"

    # Verify in DB
    updated_user = await user_crud.get(db_session, user.id)
    assert updated_user.full_name == "Updated Name"

@pytest.mark.asyncio
async def test_change_current_user_password(client: AsyncClient, db_session: AsyncSession):
    """
    Test changing current user's password.
    """
    # Create and login a user
    await role_crud.create_role(db_session, {"name": "user", "description": "Default user role"})
    user_data = UserCreate(email="passwordchange@example.com", password="OldPassword123", full_name="Password Change User")
    user = await auth_service.register_user(db_session, user_data)
    user.is_verified = True
    await db_session.commit()
    await db_session.refresh(user)

    login_response = await client.post(
        f"{settings.API_V1_STR}/auth/login",
        json={"email": "passwordchange@example.com", "password": "OldPassword123"}
    )
    access_token = login_response.json()["access_token"]

    change_password_payload = {
        "current_password": "OldPassword123",
        "new_password": "NewStrongPassword456"
    }
    response = await client.put(
        f"{settings.API_V1_STR}/users/me/password",
        headers={"Authorization": f"Bearer {access_token}"},
        json=change_password_payload
    )
    assert response.status_code == 200
    assert response.json()["message"] == "Password updated successfully"

    # Try logging in with new password
    login_response_new = await client.post(
        f"{settings.API_V1_STR}/auth/login",
        json={"email": "passwordchange@example.com", "password": "NewStrongPassword456"}
    )
    assert login_response_new.status_code == 200

    # Old password should not work
    login_response_old = await client.post(
        f"{settings.API_V1_STR}/auth/login",
        json={"email": "passwordchange@example.com", "password": "OldPassword123"}
    )
    assert login_response_old.status_code == 401

@pytest.mark.asyncio
async def test_admin_get_all_users(client: AsyncClient, db_session: AsyncSession):
    """
    Test admin's ability to get all users.
    """
    # Create admin role and user
    await role_crud.create_role(db_session, {"name": "user", "description": "Default user role"})
    admin_role = await role_crud.create_role(db_session, {"name": "admin", "description": "Admin role"})

    admin_user = await auth_service.register_user(db_session, UserCreate(email="admin@example.com", password="AdminPassword123", full_name="Admin User"))
    admin_user.is_verified = True
    await user_crud.set_user_roles(db_session, admin_user, [admin_role])
    await db_session.commit()
    await db_session.refresh(admin_user)

    # Create a regular user
    await auth_service.register_user(db_session, UserCreate(email="regular@example.com", password="RegularPassword123", full_name="Regular User"))

    # Login as admin
    login_response = await client.post(
        f"{settings.API_V1_STR}/auth/login",
        json={"email": "admin@example.com", "password": "AdminPassword123"}
    )
    admin_access_token = login_response.json()["access_token"]

    response = await client.get(
        f"{settings.API_V1_STR}/admin/users",
        headers={"Authorization": f"Bearer {admin_access_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2 # Admin and regular user
    assert any(u["email"] == "admin@example.com" for u in data)
    assert any(u["email"] == "regular@example.com" for u in data)

@pytest.mark.asyncio
async def test_admin_assign_roles(client: AsyncClient, db_session: AsyncSession):
    """
    Test admin's ability to assign roles to a user.
    """
    # Create roles
    user_role = await role_crud.create_role(db_session, {"name": "user", "description": "Default user role"})
    admin_role = await role_crud.create_role(db_session, {"name": "admin", "description": "Admin role"})
    editor_role = await role_crud.create_role(db_session, {"name": "editor", "description": "Editor role"})
    await db_session.commit()

    # Create admin user
    admin_user = await auth_service.register_user(db_session, UserCreate(email="admin_role@example.com", password="AdminPassword123", full_name="Admin Role User"))
    admin_user.is_verified = True
    await user_crud.set_user_roles(db_session, admin_user, [admin_role])
    await db_session.commit()
    await db_session.refresh(admin_user)

    # Create target user with default 'user' role
    target_user = await auth_service.register_user(db_session, UserCreate(email="target@example.com", password="TargetPassword123", full_name="Target User"))
    target_user.is_verified = True
    await db_session.commit()
    await db_session.refresh(target_user)

    # Login as admin
    login_response = await client.post(
        f"{settings.API_V1_STR}/auth/login",
        json={"email": "admin_role@example.com", "password": "AdminPassword123"}
    )
    admin_access_token = login_response.json()["access_token"]

    # Assign 'editor' role to target user (replacing 'user' role)
    assign_payload = {"role_ids": [editor_role.id]}
    response = await client.post(
        f"{settings.API_V1_STR}/admin/users/{target_user.id}/roles",
        headers={"Authorization": f"Bearer {admin_access_token}"},
        json=assign_payload
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "target@example.com"
    assert len(data["roles"]) == 1
    assert data["roles"][0]["name"] == "editor"

    # Verify in DB
    updated_target_user = await user_crud.get_with_roles(db_session, target_user.id)
    assert len(updated_target_user.roles) == 1
    assert updated_target_user.roles[0].name == "editor"

@pytest.mark.asyncio
async def test_rate_limiting_registration(client: AsyncClient, db_session: AsyncSession):
    """
    Test rate limiting on the registration endpoint.
    """
    # Ensure default 'user' role exists
    await role_crud.create_role(db_session, {"name": "user", "description": "Default user role"})
    await db_session.commit()

    # Hit the endpoint multiple times to exceed the limit (5 requests per minute)
    for i in range(5):
        response = await client.post(
            f"{settings.API_V1_STR}/auth/register",
            json={"email": f"rate_limit_{i}@example.com", "password": "Password123", "full_name": f"Rate Limit User {i}"}
        )
        assert response.status_code == 201

    # The 6th request should be rate-limited
    response = await client.post(
        f"{settings.API_V1_STR}/auth/register",
        json={"email": "rate_limit_6@example.com", "password": "Password123", "full_name": "Rate Limit User 6"}
    )
    assert response.status_code == 429
    assert "Retry-After" in response.headers
    assert response.json()["message"] == "Too many requests. Please try again later."
```