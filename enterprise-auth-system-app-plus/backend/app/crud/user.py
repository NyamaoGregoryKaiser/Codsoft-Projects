```python
from typing import List, Optional

from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

from app.db.models import User, RefreshToken, PasswordResetToken
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash


async def get_user_by_id(db_session: AsyncSession, user_id: int) -> Optional[User]:
    """Retrieve a user by ID."""
    result = await db_session.execute(select(User).filter(User.id == user_id))
    return result.scalar_one_or_none()


async def get_user_by_email(db_session: AsyncSession, email: str) -> Optional[User]:
    """Retrieve a user by email."""
    result = await db_session.execute(select(User).filter(User.email == email))
    return result.scalar_one_or_none()


async def get_all_users(db_session: AsyncSession, skip: int = 0, limit: int = 100) -> List[User]:
    """Retrieve all users with pagination."""
    result = await db_session.execute(select(User).offset(skip).limit(limit))
    return result.scalars().all()


async def create_user(db_session: AsyncSession, user_in: UserCreate) -> User:
    """Create a new user."""
    hashed_password = get_password_hash(user_in.password)
    db_user = User(
        email=user_in.email,
        hashed_password=hashed_password,
        first_name=user_in.first_name,
        last_name=user_in.last_name,
        is_active=user_in.is_active,
        is_admin=user_in.is_admin,
    )
    db_session.add(db_user)
    await db_session.commit()
    await db_session.refresh(db_user)
    logger.info(f"User created: {db_user.email}")
    return db_user


async def update_user(db_session: AsyncSession, user_id: int, user_update: UserUpdate) -> Optional[User]:
    """Update an existing user."""
    db_user = await get_user_by_id(db_session, user_id)
    if not db_user:
        return None

    update_data = user_update.model_dump(exclude_unset=True)
    if "password" in update_data and update_data["password"]:
        update_data["hashed_password"] = get_password_hash(update_data.pop("password"))

    for key, value in update_data.items():
        setattr(db_user, key, value)

    db_session.add(db_user)
    await db_session.commit()
    await db_session.refresh(db_user)
    logger.info(f"User updated: {db_user.email} (ID: {db_user.id})")
    return db_user


async def delete_user(db_session: AsyncSession, user_id: int) -> bool:
    """Delete a user."""
    # SQLAlchemy 2.0+ delete
    result = await db_session.execute(delete(User).where(User.id == user_id))
    if result.rowcount > 0:
        await db_session.commit()
        logger.info(f"User deleted: ID {user_id}")
        return True
    return False

# Refresh Token CRUD
async def create_refresh_token_db(db_session: AsyncSession, user_id: int, token: str, expires_at: datetime) -> RefreshToken:
    """Stores a refresh token in the database."""
    db_refresh_token = RefreshToken(
        user_id=user_id,
        token=token,
        expires_at=expires_at,
        is_revoked=False
    )
    db_session.add(db_refresh_token)
    await db_session.commit()
    await db_session.refresh(db_refresh_token)
    return db_refresh_token

async def get_refresh_token_db(db_session: AsyncSession, token: str) -> Optional[RefreshToken]:
    """Retrieves a refresh token from the database."""
    result = await db_session.execute(select(RefreshToken).filter(RefreshToken.token == token))
    return result.scalar_one_or_none()

async def revoke_refresh_token_db(db_session: AsyncSession, token_id: int) -> Optional[RefreshToken]:
    """Revokes a refresh token by setting is_revoked to True."""
    db_token = await db_session.get(RefreshToken, token_id)
    if db_token:
        db_token.is_revoked = True
        await db_session.commit()
        await db_session.refresh(db_token)
        return db_token
    return None

async def delete_expired_refresh_tokens_db(db_session: AsyncSession, current_time: datetime) -> int:
    """Deletes expired refresh tokens from the database."""
    result = await db_session.execute(delete(RefreshToken).where(RefreshToken.expires_at < current_time))
    deleted_count = result.rowcount
    if deleted_count > 0:
        await db_session.commit()
        logger.info(f"Deleted {deleted_count} expired refresh tokens from DB.")
    return deleted_count


# Password Reset Token CRUD
async def create_password_reset_token_db(db_session: AsyncSession, user_id: int, token: str, expires_at: datetime) -> PasswordResetToken:
    """Stores a password reset token in the database."""
    db_reset_token = PasswordResetToken(
        user_id=user_id,
        token=token,
        expires_at=expires_at,
        is_used=False
    )
    db_session.add(db_reset_token)
    await db_session.commit()
    await db_session.refresh(db_reset_token)
    return db_reset_token

async def get_password_reset_token_db(db_session: AsyncSession, token: str) -> Optional[PasswordResetToken]:
    """Retrieves a password reset token from the database."""
    result = await db_session.execute(select(PasswordResetToken).filter(PasswordResetToken.token == token))
    return result.scalar_one_or_none()

async def mark_password_reset_token_used_db(db_session: AsyncSession, token_id: int) -> Optional[PasswordResetToken]:
    """Marks a password reset token as used."""
    db_token = await db_session.get(PasswordResetToken, token_id)
    if db_token:
        db_token.is_used = True
        await db_session.commit()
        await db_session.refresh(db_token)
        return db_token
    return None
```