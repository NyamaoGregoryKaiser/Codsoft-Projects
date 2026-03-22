from typing import Generator, Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from redis.asyncio import Redis

from app.db.session import get_db
from app.models.user import User
from app.crud.crud_user import user as crud_user
from app.core.security import decode_token
from app.core.config import settings
from app.core.exceptions import UnauthorizedException, ForbiddenException
from app.services.cache import get_redis_client

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

async def get_current_user(
    db: Annotated[AsyncSession, Depends(get_db)],
    token: Annotated[str, Depends(oauth2_scheme)],
    cache: Annotated[Redis, Depends(get_redis_client)]
) -> User:
    """
    Dependency to get the current authenticated user from a JWT token.
    Raises UnauthorizedException if token is invalid or user is inactive.
    """
    try:
        payload = decode_token(token)
        user_id = payload.get("user_id")
        token_type = payload.get("sub")

        if token_type != "access" or user_id is None:
            raise UnauthorizedException(detail="Invalid token type or missing user_id.")
        
        # Check if access token is blacklisted (e.g. if a refresh token was revoked)
        if await cache.get(f"blacklist:access:{token}"):
            raise UnauthorizedException(detail="Token has been revoked.")

        user = await crud_user.get(db, id=int(user_id))
        if not user:
            raise UnauthorizedException(detail="User not found.")
        if not user.is_active:
            raise UnauthorizedException(detail="Inactive user.")
        return user
    except UnauthorizedException as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    """Dependency to get the current active authenticated user."""
    if not current_user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")
    return current_user


async def get_current_active_verified_user(
    current_user: Annotated[User, Depends(get_current_active_user)],
) -> User:
    """Dependency to get the current active and verified authenticated user."""
    if not current_user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User email not verified."
        )
    return current_user


async def get_current_active_superuser(
    current_user: Annotated[User, Depends(get_current_active_user)],
) -> User:
    """Dependency to get the current active authenticated superuser."""
    if not current_user.is_superuser:
        raise ForbiddenException(detail="The user doesn't have enough privileges.")
    return current_user
```