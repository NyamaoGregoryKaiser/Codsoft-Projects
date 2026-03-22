```python
from typing import Optional
from datetime import datetime, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as redis

from app.core.db import get_db
from app.core.security import verify_token
from app.core.config import settings
from app.crud.user import crud_user
from app.schemas.token import TokenData
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

# Redis client for token blocklisting/session management
redis_client = redis.Redis(host=settings.REDIS_HOST, port=settings.REDIS_PORT, db=0)

async def is_token_blocked(token: str) -> bool:
    """Checks if a token is in the blocklist (e.g., after logout/revocation)."""
    return await redis_client.exists(f"blocked_token:{token}") == 1

async def block_token(token: str, expires_at: datetime):
    """Adds a token to the blocklist with its expiry time."""
    expires_in_seconds = int((expires_at - datetime.now(timezone.utc)).total_seconds())
    if expires_in_seconds > 0:
        await redis_client.setex(f"blocked_token:{token}", expires_in_seconds, "1")
        logger.info(f"Token blocked until {expires_at}. Expires in {expires_in_seconds}s.")
    else:
        logger.warning(f"Attempted to block an already expired token: {token}")


async def get_current_user(
    db: AsyncSession = Depends(get_db), token: Optional[str] = Depends(oauth2_scheme)
) -> User:
    """
    Dependency to get the current authenticated user from an access token.
    Raises HTTPException for invalid or expired tokens.
    """
    if token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check if token is blocked
    if await is_token_blocked(token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked or logged out",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token_data: TokenData = verify_token(token, token_type="access") # This handles JWTError and expiry

    user = await crud_user.get(db, id=token_data.user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")
    
    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Dependency to ensure the current user is active."""
    if not current_user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")
    return current_user

async def get_current_admin_user(current_user: User = Depends(get_current_active_user)) -> User:
    """Dependency to ensure the current user is an admin."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges"
        )
    return current_user
```