from typing import Generator, Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.core.security import decode_access_token
from app.core.exceptions import UnauthorizedException, ForbiddenException
from app.db.session import get_db
from app.db.models import User, UserRole
from app.schemas.token import TokenPayload
from app.crud.user import user as crud_user

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

async def get_current_user(
    db: AsyncSession = Depends(get_db), token: str = Depends(oauth2_scheme)
) -> User:
    try:
        payload = decode_access_token(token)
        token_data = TokenPayload(**payload)
    except (JWTError, ValidationError) as e:
        raise UnauthorizedException("Could not validate credentials") from e
    
    if token_data.sub is None:
        raise UnauthorizedException("Could not validate credentials")
    
    current_user = await crud_user.get(db, id=token_data.sub)
    if not current_user:
        raise UnauthorizedException("User not found")
    
    if not current_user.is_active:
        raise UnauthorizedException("Inactive user")
    
    return current_user

CurrentUser = Annotated[User, Depends(get_current_user)]

def get_current_active_superuser(current_user: CurrentUser) -> User:
    if not current_user.is_superuser:
        raise ForbiddenException("The user doesn't have enough privileges")
    return current_user

def get_current_active_admin_or_superuser(current_user: CurrentUser) -> User:
    if current_user.role != UserRole.ADMIN and not current_user.is_superuser:
        raise ForbiddenException("The user doesn't have enough privileges")
    return current_user

def get_current_active_user_or_admin(current_user: CurrentUser) -> User:
    if not current_user.is_active:
        raise ForbiddenException("Inactive user")
    return current_user