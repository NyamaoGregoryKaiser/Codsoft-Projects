from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.crud.base import CRUDBase
from app.database.models import User
from app.schemas.user import UserCreate, UserUpdate, UserRegister
from app.core.security import get_password_hash


class CRUDUser(CRUDBase[User]):
    async def get_by_email(self, db: AsyncSession, email: str) -> Optional[User]:
        """Retrieve a user by their email address."""
        stmt = select(self.model).where(self.model.email == email)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def create_user(self, db: AsyncSession, user_in: UserCreate | UserRegister) -> User:
        """Create a new user with hashed password."""
        hashed_password = get_password_hash(user_in.password)
        db_user = self.model(
            email=user_in.email,
            hashed_password=hashed_password,
            is_active=user_in.is_active,
            is_admin=user_in.is_admin
        )
        db.add(db_user)
        await db.commit()
        await db.refresh(db_user)
        return db_user

    async def update_user(self, db: AsyncSession, db_user: User, user_in: UserUpdate) -> User:
        """Update an existing user, hashing password if provided."""
        update_data = user_in.model_dump(exclude_unset=True)
        if "password" in update_data and update_data["password"]:
            update_data["hashed_password"] = get_password_hash(update_data["password"])
            del update_data["password"]

        for field, value in update_data.items():
            setattr(db_user, field, value)

        await db.commit()
        await db.refresh(db_user)
        return db_user


user = CRUDUser(User)