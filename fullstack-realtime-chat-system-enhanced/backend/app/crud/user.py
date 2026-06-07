```python
import logging
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.base import CRUDBase
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate

logger = logging.getLogger(__name__)

class CRUDUser(CRUDBase[User, UserCreate, UserUpdate]):
    """
    CRUD operations for User model.
    Extends CRUDBase with specific methods for user-related queries.
    """
    async def get_by_email(self, db: AsyncSession, email: str) -> Optional[User]:
        """
        Retrieves a user by their email address.

        Args:
            db (AsyncSession): The asynchronous database session.
            email (str): The email address of the user.

        Returns:
            Optional[User]: The user instance, or None if not found.
        """
        result = await db.execute(select(User).filter(User.email == email))
        return result.scalars().first()

    async def get_by_username(self, db: AsyncSession, username: str) -> Optional[User]:
        """
        Retrieves a user by their username.

        Args:
            db (AsyncSession): The asynchronous database session.
            username (str): The username of the user.

        Returns:
            Optional[User]: The user instance, or None if not found.
        """
        result = await db.execute(select(User).filter(User.username == username))
        return result.scalars().first()

    async def create_with_hashed_password(self, db: AsyncSession, *, obj_in: UserCreate, hashed_password: str) -> User:
        """
        Creates a new user with a pre-hashed password.

        Args:
            db (AsyncSession): The asynchronous database session.
            obj_in (UserCreate): The Pydantic schema containing user data (excluding password).
            hashed_password (str): The hashed password.

        Returns:
            User: The newly created user instance.
        """
        db_obj = User(
            username=obj_in.username,
            email=obj_in.email,
            hashed_password=hashed_password,
            is_active=True,
            is_admin=False
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        logger.info(f"User created: {db_obj.username}")
        return db_obj

    async def update_password(self, db: AsyncSession, *, user: User, hashed_password: str) -> User:
        """
        Updates a user's password with a new hashed password.

        Args:
            db (AsyncSession): The asynchronous database session.
            user (User): The user instance to update.
            hashed_password (str): The new hashed password.

        Returns:
            User: The updated user instance.
        """
        user.hashed_password = hashed_password
        db.add(user)
        await db.commit()
        await db.refresh(user)
        logger.info(f"Password updated for user: {user.username}")
        return user


user = CRUDUser(User)

```