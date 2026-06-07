```python
import logging
from typing import Generator, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from jose import JWTError

from app.core.config import settings
from app.core.database import get_db_session
from app.core.security import decode_access_token
from app.crud.user import user as crud_user
from app.models.user import User

logger = logging.getLogger(__name__)

# OAuth2PasswordBearer defines the security scheme (Bearer token in header)
reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login" # URL where client can get a token
)

async def get_current_user(
    db: AsyncSession = Depends(get_db_session),
    token: str = Depends(reusable_oauth2)
) -> User:
    """
    Dependency to get the current authenticated user from the JWT token.

    Args:
        db (AsyncSession): The asynchronous database session.
        token (str): The JWT token extracted from the Authorization header.

    Returns:
        User: The authenticated user object.

    Raises:
        HTTPException: If the token is invalid, expired, or the user is not found/inactive.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_access_token(token)
        user_id: Optional[int] = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = await crud_user.get(db, id=user_id)
    if user is None:
        raise credentials_exception
    if not user.is_active:
        logger.warning(f"Attempted access by inactive user ID: {user_id}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")
    
    return user

async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Dependency to get the current active authenticated user.
    Simply forwards from get_current_user, which already checks `is_active`.
    Can be used for endpoints that specifically require active users.
    """
    return current_user

async def get_current_active_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Dependency to get the current active authenticated administrator user.

    Args:
        current_user (User): The current authenticated user.

    Returns:
        User: The authenticated admin user object.

    Raises:
        HTTPException: If the user is not an administrator.
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="The user doesn't have enough privileges"
        )
    return current_user

```