from typing import Any
from fastapi import APIRouter, Depends, status, Response, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi_limiter.dependencies import RateLimiter

from app.schemas.user import Token, UserCreate, User
from app.schemas.auth import LoginRequest, RegisterRequest
from app.db.session import get_async_session
from app.services.auth_service import auth_service
from app.api.v1.dependencies import get_current_active_user
from loguru import logger

router = APIRouter()

@router.post("/login", response_model=Token, summary="Authenticate user and get JWT token", status_code=status.HTTP_200_OK,
             dependencies=[Depends(RateLimiter(times=5, seconds=60))])
async def login_access_token(
    db: AsyncSession = Depends(get_async_session), form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    user = await auth_service.authenticate_user(db, form_data.username, form_data.password)
    token = await auth_service.create_access_token_for_user(user)
    logger.info(f"User '{user.username}' logged in successfully.")
    return token

@router.post("/register", response_model=User, summary="Register a new user", status_code=status.HTTP_201_CREATED,
             dependencies=[Depends(RateLimiter(times=2, seconds=3600))]) # 2 registrations per hour
async def register_user(
    db: AsyncSession = Depends(get_async_session),
    user_in: RegisterRequest = Depends()
) -> Any:
    """
    Register a new user account.
    """
    user_create = UserCreate(
        username=user_in.username,
        email=user_in.email,
        password=user_in.password,
        full_name=user_in.full_name,
        is_active=True,
        is_admin=False, # Regular registration cannot create admin
    )
    user = await auth_service.create_user_register(db, user_create)
    return user

@router.get("/me", response_model=User, summary="Get current authenticated user details")
async def read_users_me(
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get current active user.
    """
    return current_user

# --- Optional: Password Reset / Change Endpoints (Conceptual/Placeholder) ---
# @router.post("/forgot-password", status_code=status.HTTP_200_OK, summary="Request password reset link")
# async def forgot_password(request: ForgotPasswordRequest, db: AsyncSession = Depends(get_async_session)):
#     """
#     Send a password reset email to the user.
#     """
#     # Implementation would involve:
#     # 1. Look up user by email.
#     # 2. Generate a unique, time-limited token.
#     # 3. Store token in DB (or cache) associated with user.
#     # 4. Send email with a link containing the token to the user.
#     # If settings.RESEND_API_KEY is available, use Resend to send emails.
#     logger.info(f"Password reset requested for {request.email}")
#     return {"message": "If a matching account is found, a password reset email will be sent."}

# @router.post("/reset-password", status_code=status.HTTP_200_OK, summary="Reset user password using token")
# async def reset_password(request: ResetPasswordRequest, db: AsyncSession = Depends(get_async_session)):
#     """
#     Reset password using the token received via email.
#     """
#     # Implementation would involve:
#     # 1. Validate the token (existence, expiry).
#     # 2. Get the associated user.
#     # 3. Hash and update the user's password.
#     # 4. Invalidate the token.
#     logger.info(f"Password reset attempt with token: {request.token[:10]}...")
#     return {"message": "Password has been reset successfully."}

# @router.put("/me/password", status_code=status.HTTP_200_OK, summary="Change current user's password")
# async def change_my_password(
#     request: PasswordChangeRequest,
#     current_user: User = Depends(get_current_active_user),
#     db: AsyncSession = Depends(get_async_session)
# ):
#     """
#     Change the password of the currently authenticated user.
#     """
#     # Implementation would involve:
#     # 1. Verify old_password against current_user.hashed_password.
#     # 2. Hash new_password and update user record.
#     logger.info(f"User '{current_user.username}' is changing their password.")
#     return {"message": "Password changed successfully."}