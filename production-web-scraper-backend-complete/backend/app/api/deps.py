from typing import Generator, Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.exceptions import UnauthorizedException, ForbiddenException
from app.core.security import ALGORITHM, decode_access_token
from app.crud.user import user as crud_user
from app.models.user import User
from app.schemas.token import TokenData

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

async def get_current_user(
    db: AsyncSession = Depends(get_db), token: str = Depends(oauth2_scheme)
) -> User:
    """Dependency to get the current authenticated user."""
    token_data = decode_access_token(token)
    if not token_data:
        raise UnauthorizedException()

    user = await crud_user.get_by_email(db, email=token_data.email)
    if not user:
        raise UnauthorizedException(detail="User not found")
    if not await crud_user.is_active(user):
        raise UnauthorizedException(detail="Inactive user")
    return user

async def get_current_active_superuser(
    current_user: User = Depends(get_current_user),
) -> User:
    """Dependency to get the current authenticated superuser."""
    if not current_user.is_superuser:
        raise ForbiddenException(detail="The user doesn't have enough privileges")
    return current_user

```
---