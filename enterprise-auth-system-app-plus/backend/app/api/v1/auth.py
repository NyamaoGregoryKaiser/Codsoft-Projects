```python
from datetime import datetime, timedelta, timezone

import redis.asyncio as redis
from fastapi import APIRouter, Depends, status, Response, Request
from fastapi.responses import JSONResponse
from fastapi_limiter.depends import RateLimiter
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

from app.core.config import settings
from app.core.dependencies import get_db, get_current_user, get_redis_client
from app.core.exceptions import UnauthorizedException, ConflictException, NotFoundException
from app.db.models import User
from app.schemas.user import UserCreate, User, PasswordResetRequest, PasswordReset
from app.schemas.token import Token
from app.services.auth_service import register_user, authenticate_user, create_tokens_for_user, \
    refresh_access_token, revoke_user_refresh_token, request_password_reset, reset_password

router = APIRouter()


@router.post(
    "/register",
    response_model=User,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
    description="Registers a new user with email and password."
)
async def register(
    user_in: UserCreate,
    db_session: AsyncSession = Depends(get_db)
):
    """
    Registers a new user.
    - `email`: User's email (must be unique).
    - `password`: User's password (min 8 characters).
    - `first_name`, `last_name`: Optional user names.
    """
    try:
        user = await register_user(db_session, user_in)
        return user
    except ConflictException as e:
        logger.warning(f"Registration failed for {user_in.email}: {e.detail}")
        raise UnauthorizedException(detail=e.detail) # Returning 401 to prevent enumeration


@router.post(
    "/login",
    response_model=Token,
    summary="User login",
    description="Authenticates a user and returns access and refresh tokens.",
    dependencies=[Depends(RateLimiter(times=5, seconds=60))] # 5 requests per minute
)
async def login(
    request: Request,
    email: str = Depends(lambda e: e), # Directly extract form data for email and password
    password: str = Depends(lambda p: p),
    db_session: AsyncSession = Depends(get_db),
    redis_client: redis.Redis = Depends(get_redis_client)
):
    """
    Authenticates a user and issues JWT tokens.
    - `email`: User's email.
    - `password`: User's password.
    """
    user = await authenticate_user(db_session, email, password)
    if not user:
        logger.warning(f"Authentication failed for email: {email}")
        raise UnauthorizedException("Incorrect email or password")
    
    # Generate and store tokens
    tokens = await create_tokens_for_user(db_session, user, redis_client)

    # Set refresh token as an HttpOnly cookie
    response = JSONResponse(content={"access_token": tokens["access_token"], "token_type": "bearer"})
    
    # Calculate cookie expiry based on refresh token expiry
    # Note: refresh_token_expires_hours is an int in settings, convert to seconds
    max_age_seconds = settings.REFRESH_TOKEN_EXPIRE_HOURS * 3600
    
    response.set_cookie(
        key="refresh_token",
        value=tokens["refresh_token"],
        httponly=True,
        secure=settings.ENV == "production",  # Use secure in production
        samesite="Lax", # Or "None" if cross-domain with secure=True
        max_age=max_age_seconds,
        expires=datetime.now(timezone.utc) + timedelta(hours=settings.REFRESH_TOKEN_EXPIRE_HOURS)
    )
    logger.info(f"User {user.email} logged in successfully.")
    return response


@router.post(
    "/refresh-token",
    response_model=Token,
    summary="Refresh access token",
    description="Exchanges a valid refresh token for a new access token and potentially a new refresh token (rotation).",
    dependencies=[Depends(RateLimiter(times=3, seconds=60))] # 3 requests per minute
)
async def refresh_tokens(
    request: Request,
    db_session: AsyncSession = Depends(get_db),
    redis_client: redis.Redis = Depends(get_redis_client)
):
    """
    Refreshes the access token using the refresh token provided in an HttpOnly cookie.
    If `REFRESH_TOKEN_DB_ENABLED` is true, the old refresh token is revoked and a new one is issued (token rotation).
    """
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        logger.warning("Refresh token not found in cookie.")
        raise UnauthorizedException("Refresh token required")

    tokens = await refresh_access_token(db_session, refresh_token, redis_client)

    response = JSONResponse(content={"access_token": tokens["access_token"], "token_type": "bearer"})
    
    # Set new refresh token as an HttpOnly cookie (rotation)
    max_age_seconds = settings.REFRESH_TOKEN_EXPIRE_HOURS * 3600
    response.set_cookie(
        key="refresh_token",
        value=tokens["refresh_token"],
        httponly=True,
        secure=settings.ENV == "production",
        samesite="Lax",
        max_age=max_age_seconds,
        expires=datetime.now(timezone.utc) + timedelta(hours=settings.REFRESH_TOKEN_EXPIRE_HOURS)
    )
    logger.info(f"Access token refreshed successfully.")
    return response


@router.post(
    "/logout",
    status_code=status.HTTP_200_OK,
    summary="User logout",
    description="Revokes the refresh token and clears the refresh token cookie.",
    dependencies=[Depends(RateLimiter(times=5, seconds=60))]
)
async def logout(
    request: Request,
    response: Response,
    db_session: AsyncSession = Depends(get_db),
    redis_client: redis.Redis = Depends(get_redis_client),
    current_user: User = Depends(get_current_user) # Ensures user is authenticated
):
    """
    Logs out the current user by revoking their refresh token and clearing the cookie.
    """
    refresh_token = request.cookies.get("refresh_token")
    if refresh_token:
        # Revoke token in DB and Redis
        await revoke_user_refresh_token(db_session, refresh_token, redis_client)
    
    # Clear the HttpOnly refresh token cookie
    response.delete_cookie(
        key="refresh_token",
        httponly=True,
        secure=settings.ENV == "production",
        samesite="Lax"
    )
    logger.info(f"User {current_user.email} logged out successfully.")
    return {"message": "Logged out successfully"}


@router.post(
    "/forgot-password",
    status_code=status.HTTP_200_OK,
    summary="Request password reset",
    description="Sends a password reset link to the user's email.",
    dependencies=[Depends(RateLimiter(times=2, seconds=300))] # 2 requests per 5 minutes per IP
)
async def forgot_password(
    email_request: PasswordResetRequest,
    db_session: AsyncSession = Depends(get_db),
    redis_client: redis.Redis = Depends(get_redis_client)
):
    """
    Initiates the password reset process.
    An email (not actually sent in this example) containing a reset token will be sent to the user.
    """
    await request_password_reset(db_session, email_request, redis_client)
    logger.info(f"Password reset requested for {email_request.email}. (Email not actually sent in this demo)")
    return {"message": "If an account with that email exists, a password reset link has been sent."}


@router.post(
    "/reset-password",
    status_code=status.HTTP_200_OK,
    summary="Reset password",
    description="Resets the user's password using a valid reset token.",
    dependencies=[Depends(RateLimiter(times=3, seconds=60))]
)
async def reset_password_confirm(
    password_reset_data: PasswordReset,
    db_session: AsyncSession = Depends(get_db),
    redis_client: redis.Redis = Depends(get_redis_client)
):
    """
    Confirms password reset.
    - `token`: The password reset token received via email.
    - `new_password`: The new password for the user (min 8 characters).
    """
    try:
        await reset_password(db_session, password_reset_data, redis_client)
        logger.info(f"Password reset successful for token provided.")
        return {"message": "Password has been successfully reset."}
    except NotFoundException as e:
        logger.warning(f"Password reset failed (user not found): {e.detail}")
        raise UnauthorizedException(detail="Invalid or expired token") # Obscure detail to prevent enumeration
    except Exception as e:
        logger.warning(f"Password reset failed: {e}")
        raise UnauthorizedException(detail="Invalid or expired token")
```