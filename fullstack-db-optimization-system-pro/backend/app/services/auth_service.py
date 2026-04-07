from datetime import timedelta
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from app.core import security
from app.core.config import settings
from app.core.exceptions import UnauthorizedException, ConflictException, ForbiddenException
from app.db import crud
from app.schemas.user import UserCreate, User, Token
from app.db.models import UserRole
from loguru import logger

class AuthService:
    async def authenticate_user(self, db: AsyncSession, username: str, password: str) -> Optional[User]:
        user = await crud.user.get_by_username(db, username=username)
        if not user or not security.verify_password(password, user.hashed_password):
            logger.warning(f"Failed login attempt for user: {username}")
            raise UnauthorizedException("Incorrect username or password")
        if not user.is_active:
            logger.warning(f"Login attempt for inactive user: {username}")
            raise UnauthorizedException("Inactive user")
        return user

    async def create_user_register(self, db: AsyncSession, user_in: UserCreate, is_admin_creation: bool = False) -> User:
        existing_user_email = await crud.user.get_by_email(db, email=user_in.email)
        if existing_user_email:
            raise ConflictException("Email already registered")

        existing_user_username = await crud.user.get_by_username(db, username=user_in.username)
        if existing_user_username:
            raise ConflictException("Username already taken")

        hashed_password = security.get_password_hash(user_in.password)
        
        # Only allow admin creation if explicitly set and handled by an admin user
        if not is_admin_creation:
            user_in.is_admin = False # Prevent regular registration from making admin
            user_in.role = UserRole.USER

        user = await crud.user.create_with_hashed_password(db, obj_in=user_in, hashed_password=hashed_password)
        logger.info(f"New user registered: {user.username} (ID: {user.id})")
        return user

    async def create_access_token_for_user(self, user: User) -> Token:
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = security.create_access_token(
            data={"sub": str(user.id), "scopes": [user.role.value]},
            expires_delta=access_token_expires
        )
        return Token(access_token=access_token)

    async def get_current_user_from_token(self, db: AsyncSession, token: str) -> User:
        payload = security.decode_access_token(token)
        user_id: str = payload.get("sub")
        if user_id is None:
            raise UnauthorizedException()
        
        scopes = payload.get("scopes", []) # Get scopes from token

        user = await crud.user.get(db, int(user_id))
        if user is None:
            raise UnauthorizedException()
        if not user.is_active:
            raise ForbiddenException("Inactive user")
        
        # Basic scope/role check: ensure user's actual role matches what's expected or implied by the token
        if user.role.value not in scopes:
             logger.warning(f"Token scopes ({scopes}) do not match user role ({user.role.value}) for user ID {user_id}. Possible token tampering or role change after token issuance.")
             # You might choose to raise UnauthorizedException here or just log and proceed if you trust the DB role more.
             # For a stricter system, uncomment the line below:
             # raise UnauthorizedException("User role mismatch with token scopes.")

        return user

auth_service = AuthService()