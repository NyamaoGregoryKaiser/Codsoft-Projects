from typing import Annotated

from fastapi import APIRouter, Depends, status, Response, Request
from sqlalchemy.ext.asyncio import AsyncSession
from redis.asyncio import Redis

from app.core.database import get_db
from app.dependencies.auth import oauth2_scheme # Used by client for token URL
from app.schemas.user import UserCreate, UserLogin, Token, UserReadPublic, Message, TokenRefresh, ForgotPasswordRequest, ResetPasswordRequest, VerifyEmailRequest
from app.services.auth import auth_service
from app.utils.redis_client import get_redis_client
from app.middleware.rate_limiter import RateLimiter
from datetime import timedelta

router = APIRouter()

# Initialize RateLimiter (will get Redis client dynamically per request)
rate_limiter = RateLimiter(redis_client=None) # type: ignore

@router.post("/register", response_model=UserReadPublic, status_code=status.HTTP_201_CREATED)
@rate_limiter.limit("register", max_requests=5, window=timedelta(minutes=1), identifier="ip")
async def register_user(
    user_in: UserCreate,
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """
    Register a new user.
    """
    user = await auth_service.register_user(db, user_in)
    return user

@router.post("/login", response_model=Token)
@rate_limiter.limit("login", max_requests=10, window=timedelta(minutes=1), identifier="ip")
async def login_for_access_token(
    response: Response,
    user_login: UserLogin,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Authenticate user and return JWT tokens.
    """
    user = await auth_service.authenticate_user(db, user_login)
    tokens = await auth_service.create_tokens(user)

    # In a real production environment, you might want to set refresh tokens as HTTP-only cookies.
    # For this example, we return both for frontend simplicity.
    # response.set_cookie(key="refresh_token", value=tokens.refresh_token, httponly=True, secure=True, max_age=tokens.refresh_token_expires_in_seconds)
    return tokens

@router.post("/refresh-token", response_model=Token)
@rate_limiter.limit("refresh_token", max_requests=20, window=timedelta(minutes=5), identifier="user_id") # Limit by user_id if token is valid, else by IP
async def refresh_access_token(
    request: Request, # To potentially get user_id from valid refresh token for rate limiting
    token_refresh: TokenRefresh,
    db: Annotated[AsyncSession, Depends(get_db)],
    redis_client: Annotated[Redis, Depends(get_redis_client)]
):
    """
    Refresh access token using a valid refresh token.
    """
    # Override rate limiter identifier if a valid user_id can be extracted from the refresh token
    # This is a bit advanced for a simple decorator, but demonstrates the concept.
    # For this example, we let the default `user_id` identifier attempt to get user from request.state,
    # and if that fails (e.g., token invalid or not yet processed), it falls back to IP.
    new_tokens = await auth_service.refresh_access_token(db, token_refresh.refresh_token, redis_client)
    return new_tokens

@router.post("/logout", response_model=Message)
async def logout_user(
    token: Annotated[str, Depends(oauth2_scheme)], # Get current access token (to ensure user is authenticated)
    token_refresh: TokenRefresh, # Explicitly provide refresh token to invalidate
    db: Annotated[AsyncSession, Depends(get_db)], # Not directly used for logout, but often available
    redis_client: Annotated[Redis, Depends(get_redis_client)]
):
    """
    Logout user by revoking their refresh token.
    """
    await auth_service.revoke_refresh_token(token_refresh.refresh_token, redis_client)
    return {"message": "Logged out successfully"}

@router.post("/forgot-password", response_model=Message)
@rate_limiter.limit("forgot_password", max_requests=3, window=timedelta(hours=1), identifier="ip")
async def forgot_password_request(
    req: ForgotPasswordRequest,
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """
    Initiate password reset process. Sends a reset email.
    """
    await auth_service.forgot_password(db, req)
    return {"message": "If an account with that email exists, a password reset link has been sent."}

@router.post("/reset-password", response_model=Message)
@rate_limiter.limit("reset_password", max_requests=5, window=timedelta(hours=1), identifier="ip")
async def reset_password(
    req: ResetPasswordRequest,
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """
    Reset password using a token received via email.
    """
    await auth_service.reset_password(db, req)
    return {"message": "Password has been reset successfully."}

@router.post("/verify-email", response_model=UserReadPublic)
@rate_limiter.limit("verify_email", max_requests=5, window=timedelta(minutes=5), identifier="ip")
async def verify_email(
    req: VerifyEmailRequest,
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """
    Verify user's email address using a token.
    """
    user = await auth_service.verify_email(db, req)
    return user

```