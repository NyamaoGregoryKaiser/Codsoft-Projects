```python
from typing import AsyncGenerator
import logging

from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import SessionLocal
from app.core.security import decode_token
from app.core.config import settings
from app.crud.users import crud_user
from app.models.user import User
from app.core.exceptions import UnauthorizedException, ForbiddenException

logger = logging.getLogger(__name__)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        yield session

async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> User:
    try:
        # Check for JWT in HTTP-only cookie first
        jwt_token = request.cookies.get("access_token")
        if not jwt_token:
            # Fallback to Authorization header if no cookie (e.g. for Swagger UI testing)
            jwt_token = token

        payload = decode_token(jwt_token)
        user_id: str = payload.get("sub")
        if user_id is None:
            raise UnauthorizedException("Invalid authentication token.")
        
        user = await crud_user.get(db, id=int(user_id))
        if user is None:
            raise UnauthorizedException("User not found.")
        return user
    except UnauthorizedException as e:
        logger.warning(f"Authentication failed: {e.message}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=e.message,
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        logger.error(f"Error getting current user: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_active:
        raise ForbiddenException("Inactive user.")
    return current_user

async def get_current_superuser(
    current_user: User = Depends(get_current_active_user),
) -> User:
    if not current_user.is_superuser:
        raise ForbiddenException("The user doesn't have enough privileges.")
    return current_user

# --- Authorization helpers ---
def verify_user_ownership(resource_owner_id: int, current_user: User):
    if not current_user.is_superuser and resource_owner_id != current_user.id:
        raise ForbiddenException("You do not have permission to manage this resource.")
```