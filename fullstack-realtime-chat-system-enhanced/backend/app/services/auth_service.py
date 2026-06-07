```python
import logging
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.user import user as crud_user
from app.schemas.user import UserCreate
from app.models.user import User
from app.core.security import verify_password, get_password_hash, create_access_token

logger = logging.getLogger(__name__)

class AuthService:
    """
    Service layer for authentication-related business logic.
    Handles user registration, authentication, and token generation.
    """

    async def register_user(self, db: AsyncSession, user_in: UserCreate) -> User:
        """
        Registers a new user after checking for existing username/email.

        Args:
            db (AsyncSession): The asynchronous database session.
            user_in (UserCreate): The Pydantic schema for user creation.

        Returns:
            User: The newly created user database object.

        Raises:
            HTTPException: If username or email already exists.
        """
        existing_user_by_email = await crud_user.get_by_email(db, email=user_in.email)
        if existing_user_by_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The user with this email already exists in the system.",
            )
        
        existing_user_by_username = await crud_user.get_by_username(db, username=user_in.username)
        if existing_user_by_username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The user with this username already exists in the system.",
            )

        hashed_password = get_password_hash(user_in.password)
        created_user = await crud_user.create_with_hashed_password(db, obj_in=user_in, hashed_password=hashed_password)
        logger.info(f"User {created_user.username} registered successfully.")
        return created_user

    async def authenticate_user(self, db: AsyncSession, username: str, password: str) -> Optional[User]:
        """
        Authenticates a user by username and password.

        Args:
            db (AsyncSession): The asynchronous database session.
            username (str): The username of the user.
            password (str): The plain-text password.

        Returns:
            Optional[User]: The authenticated user object if credentials are valid, None otherwise.
        """
        user = await crud_user.get_by_username(db, username=username)
        if not user or not verify_password(password, user.hashed_password):
            logger.warning(f"Authentication failed for user: {username}")
            return None
        if not user.is_active:
            logger.warning(f"Authentication failed for inactive user: {username}")
            return None
        logger.info(f"User {username} authenticated successfully.")
        return user

    def create_token_for_user(self, user: User) -> str:
        """
        Generates an access token for a given user.

        Args:
            user (User): The user object for whom to create the token.

        Returns:
            str: The generated JWT access token.
        """
        access_token = create_access_token(data={"sub": user.id})
        logger.debug(f"Access token created for user ID: {user.id}")
        return access_token

auth_service = AuthService()

```