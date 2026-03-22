import pytest
from httpx import AsyncClient
from app.core.config import settings
from app.schemas.user import UserCreate
from app.crud.crud_user import user as crud_user
from app.db.session import AsyncSessionLocal
from app.core.security import create_access_token, decode_token
from app.services.cache import get_redis_client
import uuid
from datetime import timedelta, datetime, timezone

# Helper to create a user directly in DB
async def create_test_user_in_db(email: str, password: str, is_superuser: bool = False, is_verified: bool = True):
    async with AsyncSessionLocal() as db:
        user_in = UserCreate(
            email=email,
            password=password,
            first_name="Test",
            last_name="User",
            is_superuser=is_superuser,
            is_verified=is_verified
        )
        return await crud_user.create(db, obj_in=user_in)

@pytest.mark.asyncio
async def test_register_user(client: AsyncClient):
    email = "newuser@example.com"
    password = "SecurePassword123"
    response = await client.post(
        f"{settings.API_V1_STR}/auth/register",
        json={"email": email, "password": password, "first_name": "Test", "last_name": "User"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == email
    assert data["is_active"] is True
    assert data["is_superuser"] is False
    assert data["is_verified"] is False # Should be False initially
    assert "id" in data

    # Verify user exists in DB
    async with AsyncSessionLocal() as db:
        user = await crud_user.get_by_email(db, email=email)
        assert user is not None
        assert user.email == email
        assert user.is_verified is False

@pytest.mark.asyncio
async def test_register_existing_email(client: AsyncClient):
    email = "existing@example.com"
    await create_test_user_in_db(email, "password123")

    response = await client.post(
        f"{settings.API_V1_STR}/auth/register",
        json={"email": email, "password": "newpassword", "first_name": "Test"}
    )
    assert response.status_code == 409
    assert response.json()["detail"] == "Email already registered."

@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    email = "testlogin@example.com"
    password = "LoginPassword123"
    await create_test_user_in_db(email, password)

    response = await client.post(
        f"{settings.API_V1_STR}/auth/login",
        data={"username": email, "password": password}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
    
    # Check refresh token cookie is set
    assert "refresh_token" in response.cookies

@pytest.mark.asyncio
async def test_login_invalid_credentials(client: AsyncClient):
    email = "invalidlogin@example.com"
    password = "InvalidPassword123"
    await create_test_user_in_db(email, password)

    response = await client.post(
        f"{settings.API_V1_STR}/auth/login",
        data={"username": email, "password": "WrongPassword"}
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect email or password."

@pytest.mark.asyncio
async def test_refresh_token_success(client: AsyncClient):
    user = await create_test_user_in_db("refresh@example.com", "RefreshPassword123")
    
    # Manually create a refresh token for testing
    jti = str(uuid.uuid4())
    refresh_token = create_access_token(
        {"user_id": user.id, "sub": "refresh", "jti": jti},
        expires_delta=timedelta(minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES)
    )

    # Set the cookie manually for the client
    client.cookies.set("refresh_token", refresh_token)

    response = await client.post(
        f"{settings.API_V1_STR}/auth/refresh"
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
    assert "refresh_token" in response.cookies # New refresh token cookie

    # Verify old refresh token is blacklisted
    redis_client = get_redis_client()
    assert await redis_client.get(f"blacklist:refresh:{jti}") is not None

@pytest.mark.asyncio
async def test_refresh_token_missing_cookie(client: AsyncClient):
    response = await client.post(
        f"{settings.API_V1_STR}/auth/refresh"
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Refresh token missing."

@pytest.mark.asyncio
async def test_refresh_token_blacklisted(client: AsyncClient):
    user = await create_test_user_in_db("blacklisted@example.com", "Password123")
    jti = str(uuid.uuid4())
    refresh_token = create_access_token(
        {"user_id": user.id, "sub": "refresh", "jti": jti},
        expires_delta=timedelta(minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES)
    )

    # Manually blacklist it
    redis_client = get_redis_client()
    await redis_client.setex(f"blacklist:refresh:{jti}", 3600, "1")

    client.cookies.set("refresh_token", refresh_token)

    response = await client.post(
        f"{settings.API_V1_STR}/auth/refresh"
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Refresh token has been revoked."

@pytest.mark.asyncio
async def test_logout(client: AsyncClient):
    email = "logout@example.com"
    password = "LogoutPassword123"
    user = await create_test_user_in_db(email, password)
    
    login_response = await client.post(
        f"{settings.API_V1_STR}/auth/login",
        data={"username": email, "password": password}
    )
    assert login_response.status_code == 200
    refresh_token_cookie = login_response.cookies["refresh_token"]
    
    # Access token from login for blacklisting test
    access_token = login_response.json()["access_token"]
    
    # Manually set the refresh token cookie for the client
    client.cookies.set("refresh_token", refresh_token_cookie)
    client.headers["Authorization"] = f"Bearer {access_token}"

    response = await client.post(
        f"{settings.API_V1_STR}/auth/logout"
    )
    assert response.status_code == 204
    assert "refresh_token" in response.cookies
    assert response.cookies["refresh_token"] == "" # Cookie should be cleared

    # Verify refresh token is blacklisted
    payload = decode_token(refresh_token_cookie)
    jti = payload.get("jti")
    redis_client = get_redis_client()
    assert await redis_client.get(f"blacklist:refresh:{jti}") is not None
    assert await redis_client.get(f"blacklist:access:{access_token}") is not None


@pytest.mark.asyncio
async def test_forgot_password(client: AsyncClient):
    email = "forgot@example.com"
    await create_test_user_in_db(email, "password123")

    response = await client.post(
        f"{settings.API_V1_STR}/auth/forgot-password",
        json={"email": email}
    )
    assert response.status_code == 202
    assert response.json()["message"] == "If a user with that email exists, a password reset link will be sent."
    # A real test would intercept the email here

@pytest.mark.asyncio
async def test_forgot_password_unknown_email(client: AsyncClient):
    response = await client.post(
        f"{settings.API_V1_STR}/auth/forgot-password",
        json={"email": "unknown@example.com"}
    )
    assert response.status_code == 202 # Still 202 for security
    assert response.json()["message"] == "If a user with that email exists, a password reset link will be sent."


@pytest.mark.asyncio
async def test_reset_password_success(client: AsyncClient):
    user = await create_test_user_in_db("reset@example.com", "oldpassword", is_verified=True)
    reset_token = create_password_reset_token(user.id)
    new_password = "NewStrongPassword123"

    response = await client.post(
        f"{settings.API_V1_STR}/auth/reset-password",
        json={"token": reset_token, "new_password": new_password}
    )
    assert response.status_code == 200
    assert response.json()["message"] == "Password has been reset successfully."

    # Verify new password works
    login_response = await client.post(
        f"{settings.API_V1_STR}/auth/login",
        data={"username": user.email, "password": new_password}
    )
    assert login_response.status_code == 200

@pytest.mark.asyncio
async def test_reset_password_invalid_token(client: AsyncClient):
    response = await client.post(
        f"{settings.API_V1_STR}/auth/reset-password",
        json={"token": "invalid.token", "new_password": "NewPassword123"}
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid or expired password reset token."

@pytest.mark.asyncio
async def test_verify_email_success(client: AsyncClient):
    user = await create_test_user_in_db("verify@example.com", "password", is_verified=False)
    assert not user.is_verified

    verification_token = create_email_verification_token(user.id)

    response = await client.post(
        f"{settings.API_V1_STR}/auth/verify-email",
        json={"token": verification_token}
    )
    assert response.status_code == 200
    assert response.json()["message"] == "Email has been verified successfully."

    # Check user in DB
    async with AsyncSessionLocal() as db:
        updated_user = await crud_user.get(db, id=user.id)
        assert updated_user.is_verified is True

@pytest.mark.asyncio
async def test_verify_email_invalid_token(client: AsyncClient):
    response = await client.post(
        f"{settings.API_V1_STR}/auth/verify-email",
        json={"token": "invalid.token"}
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid or expired email verification token."

@pytest.mark.asyncio
async def test_verify_email_already_verified(client: AsyncClient):
    user = await create_test_user_in_db("alreadyverified@example.com", "password", is_verified=True)
    verification_token = create_email_verification_token(user.id)

    response = await client.post(
        f"{settings.API_V1_STR}/auth/verify-email",
        json={"token": verification_token}
    )
    assert response.status_code == 409
    assert response.json()["detail"] == "Email already verified."
```