import logging
from typing import Generator, Optional

from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from aioredis.client import Redis
import jwt

from app.core.database import get_db
from app.core.config import settings
from app.core.security import decode_access_token
from app.core.cache import get_redis_client
from app.core.exceptions import CredentialException, ForbiddenException
from app.crud.user import user as crud_user
from app.models.user import User
from app.schemas.token import TokenPayload

logger = logging.getLogger(__name__)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

async def get_current_user(
    db: AsyncSession = Depends(get_db), token: str = Depends(oauth2_scheme)
) -> User:
    """Dependency to get the current authenticated user."""
    try:
        payload = decode_access_token(token)
        user_id: str = payload.get("sub")
        if user_id is None:
            raise CredentialException
        token_data = TokenPayload(sub=int(user_id), exp=payload.get("exp"))
    except jwt.PyJWTError:
        raise CredentialException

    db_user = await crud_user.get(db, id=token_data.sub)
    if db_user is None:
        raise CredentialException
    return db_user

async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Dependency to get the current active authenticated user."""
    if not current_user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")
    return current_user

async def get_current_admin_user(
    current_user: User = Depends(get_current_active_user),
) -> User:
    """Dependency to get the current active admin user."""
    if not current_user.is_admin:
        raise ForbiddenException(detail="The user doesn't have enough privileges")
    return current_user

async def rate_limiter(request: Request, redis_client: Redis = Depends(get_redis_client)):
    """
    Rate limiting dependency using Redis.
    Limits requests based on IP address.
    """
    client_ip = request.client.host
    key = f"rate_limit:{client_ip}"
    
    # Use a sliding window counter
    current_time = int(time.time())
    
    # Remove timestamps older than the window
    await redis_client.zremrangebyscore(key, 0, current_time - settings.RATE_LIMIT_PERIOD_SECONDS)
    
    # Add current request timestamp
    await redis_client.zadd(key, {str(current_time): current_time})
    
    # Set/update expiration for the key
    await redis_client.expire(key, settings.RATE_LIMIT_PERIOD_SECONDS)
    
    request_count = await redis_client.zcard(key)

    if request_count > settings.RATE_LIMIT_CALLS:
        remaining_time = await redis_client.ttl(key)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Try again in {remaining_time} seconds.",
            headers={"Retry-After": str(remaining_time)}
        )
    logger.debug(f"Rate limit for {client_ip}: {request_count}/{settings.RATE_LIMIT_CALLS} requests in {settings.RATE_LIMIT_PERIOD_SECONDS}s")
```