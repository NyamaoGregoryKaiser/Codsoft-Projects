```python
from typing import List, Optional

from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

from app.crud.user import get_user_by_id, get_all_users, update_user, delete_user, get_user_by_email
from app.db.models import User
from app.schemas.user import UserCreate, UserUpdate
from app.core.exceptions import ConflictException, NotFoundException


async def get_user_by_id_service(db_session: AsyncSession, user_id: int) -> Optional[User]:
    """
    Service to get a user by ID.
    """
    user = await get_user_by_id(db_session, user_id)
    if not user:
        raise NotFoundException(detail=f"User with ID {user_id} not found.")
    return user


async def get_all_users_service(db_session: AsyncSession, skip: int = 0, limit: int = 100) -> List[User]:
    """
    Service to get all users.
    """
    return await get_all_users(db_session, skip, limit)


async def create_user_service(db_session: AsyncSession, user_in: UserCreate) -> User:
    """
    Service to create a user.
    """
    existing_user = await get_user_by_email(db_session, user_in.email)
    if existing_user:
        raise ConflictException(detail="Email already registered")
    return await create_user(db_session, user_in)


async def update_user_service(db_session: AsyncSession, user_id: int, user_update: UserUpdate) -> User:
    """
    Service to update a user.
    """
    user = await get_user_by_id(db_session, user_id)
    if not user:
        raise NotFoundException(detail=f"User with ID {user_id} not found.")

    # Check if email is being updated to an existing one (excluding self)
    if user_update.email and user_update.email != user.email:
        existing_user_with_new_email = await get_user_by_email(db_session, user_update.email)
        if existing_user_with_new_email:
            raise ConflictException(detail="New email already registered by another user.")

    updated_user = await update_user(db_session, user_id, user_update)
    if not updated_user:
        # This case should theoretically not happen if get_user_by_id returned a user,
        # but as a safeguard.
        raise NotFoundException(detail=f"User with ID {user_id} not found during update.")
    return updated_user


async def delete_user_service(db_session: AsyncSession, user_id: int) -> bool:
    """
    Service to delete a user.
    """
    deleted = await delete_user(db_session, user_id)
    if not deleted:
        raise NotFoundException(detail=f"User with ID {user_id} not found for deletion.")
    return deleted

```