from typing import Optional, List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.base import CRUDBase
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash


class CRUDUser(CRUDBase[User, UserCreate, UserUpdate]):
    async def get_by_email(self, db: AsyncSession, *, email: str) -> Optional[User]:
        """Fetches a user by their email address."""
        stmt = select(self.model).where(self.model.email == email)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def create(self, db: AsyncSession, *, obj_in: UserCreate) -> User:
        """Creates a new user with hashed password."""
        hashed_password = get_password_hash(obj_in.password)
        db_obj = self.model(
            email=obj_in.email,
            hashed_password=hashed_password,
            first_name=obj_in.first_name,
            last_name=obj_in.last_name,
            is_active=obj_in.is_active if obj_in.is_active is not None else True,
            is_superuser=obj_in.is_superuser if obj_in.is_superuser is not None else False,
            is_verified=obj_in.is_verified if obj_in.is_verified is not None else False,
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def update(
        self, db: AsyncSession, *, db_obj: User, obj_in: Union[UserUpdate, Dict[str, Any]]
    ) -> User:
        """Updates a user, handling password hashing if a new password is provided."""
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.model_dump(exclude_unset=True)

        if "password" in update_data and update_data["password"]:
            update_data["hashed_password"] = get_password_hash(update_data["password"])
            del update_data["password"]

        return await super().update(db, db_obj=db_obj, obj_in=update_data)

    async def get_multi(
        self, db: AsyncSession, *, skip: int = 0, limit: int = 100
    ) -> List[User]:
        """Fetches multiple users with pagination."""
        stmt = select(self.model).offset(skip).limit(limit)
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def authenticate(self, db: AsyncSession, *, email: str, password: str) -> Optional[User]:
        """Authenticates a user by email and password."""
        user = await self.get_by_email(db, email=email)
        if not user or not verify_password(password, user.hashed_password):
            return None
        return user

    async def set_password(self, db: AsyncSession, *, user: User, new_password: str) -> User:
        """Sets a new password for a user."""
        user.hashed_password = get_password_hash(new_password)
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user

    async def mark_as_verified(self, db: AsyncSession, *, user: User) -> User:
        """Marks a user's email as verified."""
        user.is_verified = True
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user


user = CRUDUser(User)
```