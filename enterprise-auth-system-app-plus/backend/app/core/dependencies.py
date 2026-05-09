```python
from typing import AsyncGenerator, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from loguru import logger
import redis.asyncio as redis
from starlette.requests import Request

from app.core.config import settings
from app.core.exceptions import UnauthorizedException, ForbiddenException
from app.core.security import decode_token
from app.db.session import async_session
from app.db.models import User
from app.crud.user import get_user_by_id
from app.services.auth_service import is_refresh_token_revoked

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_db() -> AsyncGenerator:
    """
    Dependency to provide an async database session.
    """
    async with async_session() as session:
        yield session


async def get_current_user(
    request: Request,
    token: str = Depends(oauth2_scheme),
    db_session: AsyncGenerator = Depends(get_db)
) -> User:
    """
    Dependency to get the current authenticated user from an access token.
    Raises UnauthorizedException if token is invalid or user not found.
    """
    credentials_exception = UnauthorizedException(
        detail="Could not validate credentials"
    )
    if not token:
        raise credentials_exception

    payload = decode_token(token)
    if payload is None:
        raise credentials_exception

    user_id: Optional[str] = payload.get("sub")
    is_refresh: Optional[bool] = payload.get("is_refresh_token")

    if user_id is None or is_refresh:
        raise credentials_exception
    
    # Check if access token is in a blacklist (optional, generally for immediate logout)
    # For a fully robust token revocation, usually it's done for refresh tokens
    # and access tokens are short-lived.
    # if await is_access_token_revoked(token, request.app.state.redis):
    #     logger.warning(f"Revoked access token used by user_id: {user_id}")
    #     raise UnauthorizedException("Access token has been revoked")


    user = await get_user_by_id(db_session, int(user_id))
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise ForbiddenException("Inactive user")
    return user


async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Dependency to get the current active authenticated user.
    """
    return current_user


async def get_current_admin_user(current_user: User = Depends(get_current_active_user)) -> User:
    """
    Dependency to get the current authenticated admin user.
    Raises ForbiddenException if the user is not an administrator.
    """
    if not current_user.is_admin:
        raise ForbiddenException("User does not have administrative privileges")
    return current_user

async def get_redis_client(request: Request) -> redis.Redis:
    """
    Dependency to provide the Redis client.
    """
    if not hasattr(request.app.state, 'redis') or not request.app.state.redis:
        logger.error("Redis client not initialized in app state.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Redis service unavailable"
        )
    return request.app.state.redis
```