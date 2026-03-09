from datetime import timedelta

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.exceptions import UnauthorizedException
from app.core.security import create_access_token, verify_password
from app.crud.user import user as crud_user
from app.models.user import User
from app.schemas.token import Token
from app.schemas.user import UserCreate

class AuthService:
    def __init__(self, db: AsyncSession = Depends(get_db)):
        self.db = db

    async def authenticate_user(self, email: str, password: str) -> User:
        """Authenticates a user by email and password."""
        user = await crud_user.get_by_email(self.db, email=email)
        if not user or not verify_password(password, user.hashed_password):
            raise UnauthorizedException(detail="Incorrect email or password")
        if not await crud_user.is_active(user):
            raise UnauthorizedException(detail="Inactive user")
        return user

    async def create_user_token(self, user: User) -> Token:
        """Creates an access token for a given user."""
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"email": user.email, "id": user.id}, expires_delta=access_token_expires
        )
        return Token(access_token=access_token, token_type="bearer")

    async def register_new_user(self, user_in: UserCreate) -> User:
        """Registers a new user."""
        existing_user = await crud_user.get_by_email(self.db, email=user_in.email)
        if existing_user:
            raise UnauthorizedException(detail="Email already registered")
        new_user = await crud_user.create(self.db, obj_in=user_in)
        return new_user

```
---