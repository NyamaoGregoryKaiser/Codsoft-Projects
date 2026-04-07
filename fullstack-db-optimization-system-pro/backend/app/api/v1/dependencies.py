from typing import Generator, Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_async_session
from app.core.config import settings
from app.core.exceptions import UnauthorizedException, ForbiddenException
from app.services.auth_service import auth_service
from app.db.models import User, UserRole


oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

async def get_current_user(
    db: AsyncSession = Depends(get_async_session),
    token: str = Depends(oauth2_scheme),
) -> User:
    try:
        user = await auth_service.get_current_user_from_token(db, token)
        return user
    except UnauthorizedException as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=e.detail,
            headers={"WWW-Authenticate": "Bearer"},
        )
    except ForbiddenException as e:
         raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=e.detail,
        )

# Dependencies for role-based access control
async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_active:
        raise ForbiddenException("Inactive user")
    return current_user

async def get_current_admin_user(current_user: User = Depends(get_current_active_user)) -> User:
    if current_user.role != UserRole.ADMIN:
        raise ForbiddenException("User does not have administrator privileges")
    return current_user

# Reusable session dependency
DBSession = Annotated[AsyncSession, Depends(get_async_session)]
CurrentUser = Annotated[User, Depends(get_current_active_user)]
AdminUser = Annotated[User, Depends(get_current_admin_user)]