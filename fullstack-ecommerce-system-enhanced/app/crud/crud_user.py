```python
import logging
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash

logger = logging.getLogger("ecommerce_system")

async def get_user(db: AsyncSession, user_id: int) -> Optional[User]:
    """Retrieve a user by their ID."""
    result = await db.execute(select(User).filter(User.id == user_id))
    return result.scalar_one_or_none()

async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
    """Retrieve a user by their email address."""
    result = await db.execute(select(User).filter(User.email == email))
    return result.scalar_one_or_none()

async def get_users(db: AsyncSession, skip: int = 0, limit: int = 100) -> List[User]:
    """Retrieve multiple users with pagination."""
    result = await db.execute(select(User).offset(skip).limit(limit))
    return result.scalars().all()

async def create_user(db: AsyncSession, user_in: UserCreate) -> User:
    """Create a new user with a hashed password."""
    hashed_password = get_password_hash(user_in.password)
    db_user = User(
        email=user_in.email,
        hashed_password=hashed_password,
        first_name=user_in.first_name,
        last_name=user_in.last_name,
        is_admin=user_in.is_admin,
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    logger.info(f"User created: {db_user.email}")
    return db_user

async def update_user(db: AsyncSession, user: User, user_in: UserUpdate) -> User:
    """Update an existing user's details."""
    update_data = user_in.model_dump(exclude_unset=True)
    if "password" in update_data and update_data["password"]:
        update_data["hashed_password"] = get_password_hash(update_data["password"])
        del update_data["password"] # Remove plaintext password from update data

    for key, value in update_data.items():
        setattr(user, key, value)
    
    db.add(user)
    await db.commit()
    await db.refresh(user)
    logger.info(f"User updated: {user.email} (ID: {user.id})")
    return user

async def delete_user(db: AsyncSession, user_id: int) -> None:
    """Delete a user by their ID."""
    user = await get_user(db, user_id)
    if user:
        await db.delete(user)
        await db.commit()
        logger.info(f"User deleted: ID {user_id}")
    else:
        logger.warning(f"Attempted to delete non-existent user: ID {user_id}")

```