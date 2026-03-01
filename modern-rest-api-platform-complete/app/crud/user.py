from typing import Any, Dict, Optional, Union, List

from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.base import CRUDBase
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash

class CRUDUser(CRUDBase[User, UserCreate, UserUpdate]):
    async def get_by_email(self, db: AsyncSession, *, email: str) -> Optional[User]:
        """Retrieve a user by their email address."""
        result = await db.execute(select(User).filter(User.email == email))
        return result.scalar_one_or_none()

    async def create(self, db: AsyncSession, *, obj_in: UserCreate) -> User:
        """Create a new user with hashed password."""
        hashed_password = get_password_hash(obj_in.password)
        db_obj = User(
            email=obj_in.email,
            hashed_password=hashed_password,
            is_active=True,
            is_admin=False # Default to regular user
        )
        db.add(db_obj)
        await db.flush()
        await db.refresh(db_obj)
        return db_obj

    async def update(
        self, db: AsyncSession, *, db_obj: User, obj_in: Union[UserUpdate, Dict[str, Any]]
    ) -> User:
        """Update an existing user, handling password hashing if updated."""
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.model_dump(exclude_unset=True)

        if "password" in update_data and update_data["password"]:
            update_data["hashed_password"] = get_password_hash(update_data["password"])
            del update_data["password"] # Remove plain password before updating model

        return await super().update(db, db_obj=db_obj, obj_in=update_data)

    async def get_admins(self, db: AsyncSession, *, skip: int = 0, limit: int = 100) -> List[User]:
        """Retrieve all admin users."""
        result = await db.execute(select(User).filter(User.is_admin == True).offset(skip).limit(limit))
        return result.scalars().all()


user = CRUDUser(User)
```