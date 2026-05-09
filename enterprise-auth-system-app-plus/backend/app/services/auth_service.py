```python
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional
from uuid import uuid4

import redis.asyncio as redis
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

from app.core.config import settings
from app.core.exceptions import UnauthorizedException, ConflictException, ForbiddenException, NotFoundException, \
    ValidationException
from app.core.security import verify_password, create_access_token, create_refresh_token, decode_token, \
    get_password_hash
from app.crud.user import get_user_by_email, create_user, get_refresh_token_db, create_refresh_token_db, \
    revoke_refresh_token_db, get_user_by_id, create_password_reset_token_db, get_password_reset_token_db, \
    mark_password_reset_token_used_db, update_user
from app.db.models import User
from app.schemas.user import UserCreate, PasswordResetRequest, PasswordReset
from app.schemas.token import TokenPayload


# Cache keys
REFRESH_TOKEN_BLACKLIST_PREFIX = "refresh_blacklist:"
PASSWORD_RESET_TOKEN_PREFIX = "pwd_reset:"


async def register_user(db_session: AsyncSession, user_in: UserCreate) -> User:
    """
    Registers a new user.
    """
    existing_user = await get_user_by_email(db_session, user_in.email)
    if existing_user:
        raise ConflictException(detail="Email already registered")
    return await create_user(db_session, user_in)


async def authenticate_user(db_session: AsyncSession, email: str, password: str) -> Optional[User]:
    """
    Authenticates a user by email and password.
    """
    user = await get_user_by_email(db_session, email)
    if not user or not verify_password(password, user.hashed_password):
        return None
    if not user.is_active:
        raise ForbiddenException(detail="Inactive user")
    return user


async def create_tokens_for_user(db_session: AsyncSession, user: User, redis_client: redis.Redis) -> Dict[str, str]:
    """
    Creates access and refresh tokens for a user.
    If REFRESH_TOKEN_DB_ENABLED is True, stores the refresh token in DB and Redis.
    """
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id), "is_refresh_token": False}, expires_delta=access_token_expires
    )

    refresh_token_expires = timedelta(hours=settings.REFRESH_TOKEN_EXPIRE_HOURS)
    refresh_token = create_refresh_token(
        data={"sub": str(user.id), "is_refresh_token": True}, expires_delta=refresh_token_expires
    )

    if settings.REFRESH_TOKEN_DB_ENABLED:
        # Store refresh token in DB
        db_refresh_token = await create_refresh_token_db(
            db_session, user.id, refresh_token, datetime.now(timezone.utc) + refresh_token_expires
        )
        # Store in Redis for quick revocation check (optional, but good for scale)
        await redis_client.set(
            f"{REFRESH_TOKEN_BLACKLIST_PREFIX}{db_refresh_token.token}",
            "false",  # "false" means not revoked, "true" means revoked
            ex=int(refresh_token_expires.total_seconds())
        )
        logger.info(f"Refresh token for user {user.id} stored in DB and Redis.")

    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}


async def refresh_access_token(
    db_session: AsyncSession, refresh_token: str, redis_client: redis.Redis
) -> Dict[str, str]:
    """
    Refreshes an access token using a valid refresh token.
    Handles refresh token rotation and revocation.
    """
    payload = decode_token(refresh_token)
    if payload is None:
        raise UnauthorizedException("Invalid refresh token")

    token_data = TokenPayload(**payload)
    if not token_data.is_refresh_token:
        raise UnauthorizedException("Provided token is not a refresh token")
    if token_data.exp and token_data.exp < datetime.now(timezone.utc):
        raise UnauthorizedException("Refresh token expired")

    user_id = token_data.sub
    if user_id is None:
        raise UnauthorizedException("Invalid refresh token payload")

    user = await get_user_by_id(db_session, user_id)
    if not user or not user.is_active:
        raise UnauthorizedException("User associated with refresh token is invalid or inactive")

    # Check against DB/Redis blacklist if enabled
    if settings.REFRESH_TOKEN_DB_ENABLED:
        db_token = await get_refresh_token_db(db_session, refresh_token)
        if not db_token or db_token.is_revoked or db_token.expires_at < datetime.now(timezone.utc):
            logger.warning(f"Attempted use of revoked or expired DB refresh token by user_id: {user_id}")
            raise UnauthorizedException("Refresh token revoked or expired")
        
        # Check Redis blacklist as well
        redis_blacklist_status = await redis_client.get(f"{REFRESH_TOKEN_BLACKLIST_PREFIX}{refresh_token}")
        if redis_blacklist_status == "true":
            logger.warning(f"Attempted use of revoked Redis refresh token by user_id: {user_id}")
            raise UnauthorizedException("Refresh token revoked")
        
        # Revoke the old refresh token (rotate)
        await revoke_refresh_token_db(db_session, db_token.id)
        await redis_client.set(
            f"{REFRESH_TOKEN_BLACKLIST_PREFIX}{db_token.token}",
            "true",
            ex=int((db_token.expires_at - datetime.now(timezone.utc)).total_seconds()) # Keep in blacklist until original expiry
        )
        logger.info(f"Old refresh token for user {user.id} revoked (ID: {db_token.id}).")

    # Create new access and refresh tokens
    return await create_tokens_for_user(db_session, user, redis_client)


async def revoke_user_refresh_token(db_session: AsyncSession, token: str, redis_client: redis.Redis) -> bool:
    """
    Revokes a specific refresh token by blacklisting it in Redis and marking as revoked in DB.
    """
    if not settings.REFRESH_TOKEN_DB_ENABLED:
        logger.warning("Refresh token revocation attempted, but REFRESH_TOKEN_DB_ENABLED is false. No action taken.")
        return False

    payload = decode_token(token)
    if payload is None:
        return False # Token is already invalid/malformed

    token_data = TokenPayload(**payload)
    if not token_data.is_refresh_token:
        logger.warning("Attempted to revoke non-refresh token.")
        return False
    
    db_token = await get_refresh_token_db(db_session, token)
    if not db_token:
        logger.warning("Attempted to revoke non-existent refresh token in DB.")
        return False

    if db_token.is_revoked:
        logger.info(f"Refresh token for user {db_token.user_id} already revoked (ID: {db_token.id}).")
        return True # Already revoked, idempotent

    await revoke_refresh_token_db(db_session, db_token.id)
    # Add to Redis blacklist immediately
    expiry_seconds = int((db_token.expires_at - datetime.now(timezone.utc)).total_seconds())
    if expiry_seconds > 0:
        await redis_client.set(f"{REFRESH_TOKEN_BLACKLIST_PREFIX}{token}", "true", ex=expiry_seconds)
    else: # Token already expired, just mark as revoked in DB
        logger.info(f"Refresh token for user {db_token.user_id} expired, marking as revoked in DB only.")

    logger.info(f"Refresh token for user {db_token.user_id} revoked (ID: {db_token.id}).")
    return True


async def is_refresh_token_revoked(token: str, redis_client: redis.Redis) -> bool:
    """
    Checks if a refresh token is revoked via Redis blacklist.
    """
    if not settings.REFRESH_TOKEN_DB_ENABLED:
        return False
    
    status = await redis_client.get(f"{REFRESH_TOKEN_BLACKLIST_PREFIX}{token}")
    return status == "true"


async def request_password_reset(db_session: AsyncSession, email_request: PasswordResetRequest, redis_client: redis.Redis) -> bool:
    """
    Initiates a password reset process by generating a token and sending a "reset link".
    In a real app, this would send an email. Here, it just returns the token.
    """
    user = await get_user_by_email(db_session, email_request.email)
    if not user:
        # Prevent email enumeration: always return True even if user doesn't exist
        logger.warning(f"Password reset requested for non-existent email: {email_request.email}")
        return True

    reset_token_str = str(uuid4())
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=60) # Token valid for 1 hour

    db_reset_token = await create_password_reset_token_db(db_session, user.id, reset_token_str, expires_at)
    
    # Store token in Redis for quick lookup and expiry
    await redis_client.set(
        f"{PASSWORD_RESET_TOKEN_PREFIX}{reset_token_str}",
        str(user.id),
        ex=int((expires_at - datetime.now(timezone.utc)).total_seconds())
    )
    logger.info(f"Password reset token generated for user {user.id}: {reset_token_str}")

    # In a real application, you would send an email here with a link like:
    # f"frontend_url/reset-password?token={reset_token_str}"
    
    return True # Always return true to avoid user enumeration


async def reset_password(db_session: AsyncSession, password_reset_data: PasswordReset, redis_client: redis.Redis) -> bool:
    """
    Resets a user's password using a valid reset token.
    """
    reset_token_str = password_reset_data.token
    new_password = password_reset_data.new_password

    # Check Redis first for speed and expiry
    user_id_from_redis = await redis_client.get(f"{PASSWORD_RESET_TOKEN_PREFIX}{reset_token_str}")
    if not user_id_from_redis:
        raise ValidationException("Invalid or expired password reset token.")
    
    # Validate token in DB to ensure it hasn't been used
    db_reset_token = await get_password_reset_token_db(db_session, reset_token_str)
    if not db_reset_token or db_reset_token.is_used or db_reset_token.user_id != int(user_id_from_redis):
        raise ValidationException("Invalid or expired password reset token.")
    
    # Check expiry again for good measure
    if db_reset_token.expires_at < datetime.now(timezone.utc):
        raise ValidationException("Expired password reset token.")

    user = await get_user_by_id(db_session, db_reset_token.user_id)
    if not user:
        logger.error(f"User not found for password reset token ID: {db_reset_token.id}")
        raise NotFoundException("User not found.")

    # Update user's password
    await update_user(db_session, user.id, {"password": new_password})

    # Mark token as used
    await mark_password_reset_token_used_db(db_session, db_reset_token.id)
    
    # Invalidate token from Redis immediately
    await redis_client.delete(f"{PASSWORD_RESET_TOKEN_PREFIX}{reset_token_str}")
    
    logger.info(f"Password for user {user.id} reset successfully.")
    return True
```