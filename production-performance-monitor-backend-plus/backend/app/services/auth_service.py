from datetime import timedelta
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.security import OAuth2PasswordBearer
from fastapi import Depends
from app.core.config import settings
from app.core.exceptions import UnauthorizedException
from app.core.security import (
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token
)
from app.crud.user import user as crud_user
from app.database.models import User
from app.schemas.user import UserRegister
from app.schemas.base import TokenData
from app.database.session import get_db_session
from app.services.user_service import user_service

# OAuth2PasswordBearer is used to handle token extraction from the request header
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/token")


class AuthService:
    def __init__(self):
        self.user_service = user_service

    async def authenticate_user(self, db: AsyncSession, email: str, password: str) -> Optional[User]:
        """Authenticates a user by email and password."""
        user = await self.user_service.get_user_by_email(db, email=email)
        if not user or not user.is_active:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user

    async def create_tokens(self, user_id: int, email: str, is_admin: bool) -> tuple[str, str]:
        """Generates access and refresh tokens for a user."""
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        refresh_token_expires = timedelta(minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES)

        access_token = create_access_token(
            data={"user_id": user_id, "email": email, "is_admin": is_admin},
            expires_delta=access_token_expires
        )
        refresh_token = create_refresh_token(
            data={"user_id": user_id, "email": email, "is_admin": is_admin},
            expires_delta=refresh_token_expires
        )
        return access_token, refresh_token

    async def register_user(self, db: AsyncSession, user_in: UserRegister) -> User:
        """Registers a new user."""
        return await self.user_service.create_user(db, user_in=user_in)

    async def get_current_user(self, db: AsyncSession, token: str = Depends(oauth2_scheme)) -> User:
        """Dependency to get the current authenticated user."""
        payload = decode_token(token)
        user_id: int = payload.get("user_id")
        token_sub: str = payload.get("sub") # 'access' or 'refresh'

        if user_id is None or token_sub != 'access':
            raise UnauthorizedException("Invalid authentication token")

        user = await self.user_service.get_user(db, user_id=user_id)
        if user is None or not user.is_active:
            raise UnauthorizedException("User not found or inactive")
        return user

    async def get_current_admin_user(self, current_user: User = Depends(get_current_user)) -> User:
        """Dependency to get the current authenticated admin user."""
        if not current_user.is_admin:
            raise UnauthorizedException("Not an administrator")
        return current_user

    async def refresh_access_token(self, db: AsyncSession, refresh_token: str) -> tuple[str, str]:
        """Refreshes an access token using a refresh token."""
        payload = decode_token(refresh_token)
        user_id: int = payload.get("user_id")
        token_sub: str = payload.get("sub")

        if user_id is None or token_sub != 'refresh':
            raise UnauthorizedException("Invalid refresh token")

        user = await self.user_service.get_user(db, user_id=user_id)
        if user is None or not user.is_active:
            raise UnauthorizedException("User not found or inactive")

        return await self.create_tokens(user.id, user.email, user.is_admin)


auth_service = AuthService()