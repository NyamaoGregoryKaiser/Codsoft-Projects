from datetime import datetime, timezone, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, status, Response, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from redis.asyncio import Redis
from fastapi_limiter.depends import RateLimiter

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    create_password_reset_token,
    verify_password_reset_token,
    create_email_verification_token,
    verify_email_verification_token
)
from app.core.exceptions import (
    UnauthorizedException,
    BadRequestException,
    NotFoundException,
    ConflictException
)
from app.dependencies import get_db, get_redis_client
from app.schemas.user import (
    UserRegister,
    Token,
    PasswordResetRequest,
    PasswordReset,
    EmailVerificationRequest,
    User as UserSchema
)
from app.crud.crud_user import user as crud_user
from app.services.email import send_email
from app.services.cache import is_refresh_token_blacklisted, invalidate_refresh_token, blacklist_access_token
from app.core.logging_config import setup_logging

logger = setup_logging(__name__)

router = APIRouter()

@router.post("/register", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
async def register_user(
    *,
    db: Annotated[AsyncSession, Depends(get_db)],
    user_in: UserRegister
):
    """
    Register a new user.
    """
    existing_user = await crud_user.get_by_email(db, email=user_in.email)
    if existing_user:
        raise ConflictException(detail="Email already registered.")

    user = await crud_user.create(db, obj_in=user_in)

    # Send email verification link
    token = create_email_verification_token(user.id)
    verification_link = f"{settings.FRONTEND_VERIFY_EMAIL_URL}?token={token}"
    await send_email(
        user.email,
        "Verify your email address",
        f"Please verify your email by clicking on this link: {verification_link}"
    )
    logger.info(f"Verification email sent to {user.email}")

    return user

@router.post("/login", response_model=Token)
@router.post("/token", response_model=Token, include_in_schema=False) # For OAuth2PasswordBearer
async def login_for_access_token(
    response: Response,
    db: Annotated[AsyncSession, Depends(get_db)],
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    cache: Annotated[Redis, Depends(get_redis_client)],
    rate_limiter: Annotated[RateLimiter(times=5, seconds=60), Depends(RateLimiter)] # 5 requests per minute per IP
):
    """
    OAuth2 compatible token login, get an access token for future requests.
    """
    user = await crud_user.authenticate(db, email=form_data.username, password=form_data.password)
    if not user:
        raise UnauthorizedException(detail="Incorrect email or password.")
    if not user.is_active:
        raise UnauthorizedException(detail="User is inactive.")
    
    # Generate new tokens
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    refresh_token_expires = timedelta(minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES)
    
    access_token = create_access_token(
        data={"user_id": user.id}, expires_delta=access_token_expires
    )
    
    # Store refresh token in Redis for blacklisting support (using JTI for identification)
    # The actual refresh token itself is the value, with JTI in payload for lookup
    refresh_token_payload = {"user_id": user.id, "jti": str(uuid.uuid4())}
    refresh_token = create_refresh_token(
        data=refresh_token_payload, expires_delta=refresh_token_expires
    )

    # Set refresh token as an HttpOnly cookie
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=settings.BACKEND_CORS_ORIGINS[0].startswith("https"), # Use https in prod
        samesite="Lax", # Or "Strict" depending on needs
        expires=int(refresh_token_expires.total_seconds()),
        path="/api/v1/auth/refresh", # Only send this cookie to refresh endpoint
    )

    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}


@router.post("/refresh", response_model=Token)
async def refresh_access_token(
    request: Request,
    response: Response,
    db: Annotated[AsyncSession, Depends(get_db)],
    cache: Annotated[Redis, Depends(get_redis_client)]
):
    """
    Refresh an access token using a refresh token from an HttpOnly cookie.
    """
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise UnauthorizedException(detail="Refresh token missing.")

    try:
        payload = decode_token(refresh_token)
        user_id = payload.get("user_id")
        token_type = payload.get("sub")
        jti = payload.get("jti") # JWT ID for refresh token blacklisting

        if token_type != "refresh" or user_id is None or jti is None:
            raise UnauthorizedException(detail="Invalid refresh token payload.")
        
        # Check if refresh token is blacklisted
        if await is_refresh_token_blacklisted(jti):
            raise UnauthorizedException(detail="Refresh token has been revoked.")

        user = await crud_user.get(db, id=int(user_id))
        if not user or not user.is_active:
            raise UnauthorizedException(detail="User inactive or not found.")

        # Invalidate the old refresh token (by adding its JTI to blacklist)
        # and generate a new pair of tokens
        token_expiration_time = datetime.fromtimestamp(payload.get("exp"), tz=timezone.utc)
        expires_in_seconds = (token_expiration_time - datetime.now(timezone.utc)).total_seconds()
        if expires_in_seconds > 0:
            await invalidate_refresh_token(jti, int(expires_in_seconds))
        else:
            raise UnauthorizedException(detail="Refresh token expired.")

        new_access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        new_refresh_token_expires = timedelta(minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES)

        new_access_token = create_access_token(
            data={"user_id": user.id}, expires_delta=new_access_token_expires
        )
        
        new_refresh_token_payload = {"user_id": user.id, "jti": str(uuid.uuid4())}
        new_refresh_token = create_refresh_token(
            data=new_refresh_token_payload, expires_delta=new_refresh_token_expires
        )

        response.set_cookie(
            key="refresh_token",
            value=new_refresh_token,
            httponly=True,
            secure=settings.BACKEND_CORS_ORIGINS[0].startswith("https"),
            samesite="Lax",
            expires=int(new_refresh_token_expires.total_seconds()),
            path="/api/v1/auth/refresh",
        )

        return {"access_token": new_access_token, "refresh_token": new_refresh_token, "token_type": "bearer"}

    except UnauthorizedException:
        raise # Re-raise custom UnauthorizedException
    except Exception as e:
        logger.error(f"Error during token refresh: {e}", exc_info=True)
        raise UnauthorizedException(detail="Invalid refresh token.")

import uuid # For JTI

@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    request: Request,
    response: Response,
    cache: Annotated[Redis, Depends(get_redis_client)]
):
    """
    Log out the user by clearing the refresh token cookie and blacklisting tokens.
    """
    refresh_token = request.cookies.get("refresh_token")
    if refresh_token:
        try:
            payload = decode_token(refresh_token)
            jti = payload.get("jti")
            if jti:
                token_expiration_time = datetime.fromtimestamp(payload.get("exp"), tz=timezone.utc)
                expires_in_seconds = (token_expiration_time - datetime.now(timezone.utc)).total_seconds()
                if expires_in_seconds > 0:
                    await invalidate_refresh_token(jti, int(expires_in_seconds))
            # Blacklist current access token if present (optional, but good for explicit logout)
            # You'd need to parse the access token from the 'Authorization' header
            auth_header = request.headers.get("Authorization")
            if auth_header and auth_header.startswith("Bearer "):
                access_token = auth_header.split(" ")[1]
                access_token_payload = decode_token(access_token)
                access_token_exp_time = datetime.fromtimestamp(access_token_payload.get("exp"), tz=timezone.utc)
                access_token_expires_in = (access_token_exp_time - datetime.now(timezone.utc)).total_seconds()
                if access_token_expires_in > 0:
                    await blacklist_access_token(access_token, int(access_token_expires_in))

        except Exception as e:
            logger.warning(f"Error blacklisting refresh token on logout: {e}")

    response.delete_cookie(
        key="refresh_token",
        httponly=True,
        secure=settings.BACKEND_CORS_ORIGINS[0].startswith("https"),
        samesite="Lax",
        path="/api/v1/auth/refresh",
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/forgot-password", status_code=status.HTTP_202_ACCEPTED)
async def forgot_password(
    db: Annotated[AsyncSession, Depends(get_db)],
    email_request: PasswordResetRequest,
    rate_limiter: Annotated[RateLimiter(times=3, seconds=300), Depends(RateLimiter)] # 3 requests per 5 minutes per IP
):
    """
    Request a password reset link to be sent to the user's email.
    """
    user = await crud_user.get_by_email(db, email=email_request.email)
    if not user or not user.is_active:
        # Don't reveal if user exists for security reasons, just return 202
        logger.info(f"Password reset requested for unknown/inactive email: {email_request.email}")
        return {"message": "If a user with that email exists, a password reset link will be sent."}

    token = create_password_reset_token(user.id)
    reset_link = f"{settings.FRONTEND_RESET_PASSWORD_URL}?token={token}"

    await send_email(
        user.email,
        "Password Reset Request",
        f"You requested a password reset. Click this link to reset your password: {reset_link}\n"
        f"This link is valid for {settings.PASSWORD_RESET_TOKEN_EXPIRE_HOURS} hour(s)."
    )
    logger.info(f"Password reset email sent to {user.email}")
    return {"message": "If a user with that email exists, a password reset link will be sent."}


@router.post("/reset-password", status_code=status.HTTP_200_OK)
async def reset_password(
    db: Annotated[AsyncSession, Depends(get_db)],
    password_reset: PasswordReset
):
    """
    Reset user's password using a valid token.
    """
    user_id = verify_password_reset_token(password_reset.token)
    if not user_id:
        raise BadRequestException(detail="Invalid or expired password reset token.")

    user = await crud_user.get(db, id=user_id)
    if not user or not user.is_active:
        raise NotFoundException(detail="User not found or inactive.")

    await crud_user.set_password(db, user=user, new_password=password_reset.new_password)
    logger.info(f"User {user.email} successfully reset their password.")
    return {"message": "Password has been reset successfully."}


@router.post("/verify-email", status_code=status.HTTP_200_OK)
async def verify_email(
    db: Annotated[AsyncSession, Depends(get_db)],
    verification_request: EmailVerificationRequest
):
    """
    Verify user's email using a valid token.
    """
    user_id = verify_email_verification_token(verification_request.token)
    if not user_id:
        raise BadRequestException(detail="Invalid or expired email verification token.")

    user = await crud_user.get(db, id=user_id)
    if not user:
        raise NotFoundException(detail="User not found.")
    
    if user.is_verified:
        raise ConflictException(detail="Email already verified.")

    await crud_user.mark_as_verified(db, user=user)
    logger.info(f"User {user.email} successfully verified their email.")
    return {"message": "Email has been verified successfully."}
```