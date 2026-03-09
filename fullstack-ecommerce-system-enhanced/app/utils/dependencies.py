```python
import logging
from typing import Annotated, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.user import UserPublic
from app.core.security import decode_token
from app.crud.crud_user import get_user

logger = logging.getLogger("ecommerce_system")

# OAuth2 scheme for bearer token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")

async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)], db: AsyncSession = Depends(get_db)
) -> UserPublic:
    """
    Dependency to get the current authenticated user.
    Raises HTTPException if token is invalid or user is not found/inactive.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_token(token)
        user_id = payload.user_id
        if user_id is None:
            raise credentials_exception
    except JWTError as e:
        logger.warning(f"JWT validation failed: {e}")
        raise credentials_exception

    user = await get_user(db, user_id)
    if user is None:
        logger.warning(f"Authenticated user not found in DB (ID: {user_id}).")
        raise credentials_exception
    if not user.is_active:
        logger.warning(f"Authenticated user is inactive (ID: {user_id}).")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Inactive user")

    return UserPublic.model_validate(user)

async def get_current_user_optional(
    token: Annotated[str, Depends(oauth2_scheme)], db: AsyncSession = Depends(get_db)
) -> Optional[UserPublic]:
    """
    Dependency to get the current authenticated user if a token is provided and valid.
    Returns None if no token or invalid token, instead of raising an exception.
    """
    try:
        user = await get_current_user(token, db)
        return user
    except HTTPException as e:
        if e.status_code == status.HTTP_401_UNAUTHORIZED:
            return None # No valid token provided, user is anonymous
        raise # Re-raise other HTTP exceptions (e.g., 403 inactive)

async def get_current_admin_user(
    current_user: Annotated[UserPublic, Depends(get_current_user)]
) -> UserPublic:
    """
    Dependency to get the current authenticated admin user.
    Raises HTTPException if the user is not an admin.
    """
    if not current_user.is_admin:
        logger.warning(f"User {current_user.email} attempted admin-only access without admin privileges.")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation forbidden: Not enough privileges",
        )
    return current_user

```