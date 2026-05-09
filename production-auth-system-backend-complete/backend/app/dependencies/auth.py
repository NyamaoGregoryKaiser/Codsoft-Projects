from typing import Annotated, Optional
from datetime import datetime, UTC

from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from redis.asyncio import Redis

from app.core.database import get_db
from app.core.security import decode_token
from app.crud.users import user_crud
from app.models.user import User
from app.utils.redis_client import get_redis_client
from app.schemas.user import Message # For consistent error response

# OAuth2PasswordBearer is used for extracting the token from the Authorization header
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login", auto_error=False)

async def get_current_user(
    db: Annotated[AsyncSession, Depends(get_db)],
    token: Annotated[Optional[str], Depends(oauth2_scheme)],
    redis_client: Annotated[Redis, Depends(get_redis_client)]
) -> User:
    """
    Dependency to get the current authenticated user from an access token.
    Raises HTTPException if the token is invalid, expired, or user is not found/active.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    inactive_user_exception = HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Inactive user",
    )

    if not token:
        raise credentials_exception

    payload = decode_token(token)
    if payload is None:
        raise credentials_exception

    user_id: Optional[str] = payload.get("user_id")
    token_type: Optional[str] = payload.get("sub")
    if user_id is None or token_type != "access":
        raise credentials_exception

    # Check if access token is blacklisted (if implemented for immediate invalidation)
    # For now, we only blacklist refresh tokens, but you could add access token blacklisting
    # if you need immediate revocation before expiry for access tokens too.
    # In a typical JWT flow, access tokens are short-lived and not blacklisted.

    user = await user_crud.get_with_roles(db, int(user_id))
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise inactive_user_exception
    return user

async def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    """
    Dependency to get the current active authenticated user.
    Assumes get_current_user already handled 'is_active' check, but can add more checks here.
    """
    return current_user

def get_current_active_admin_user(
    current_user: Annotated[User, Depends(get_current_active_user)],
) -> User:
    """
    Dependency to get the current active authenticated user with 'admin' role.
    """
    if not any(role.name == "admin" for role in current_user.roles):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions (Admin role required)",
        )
    return current_user
```