```python
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.base import CRUDBase
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash

class CRUDUser(CRUDBase[User, UserCreate, UserUpdate]):
    async def get_by_email(self, db: AsyncSession, *, email: str) -> Optional[User]:
        """Retrieve a user by their email address."""
        stmt = select(self.model).filter(self.model.email == email)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def create(self, db: AsyncSession, *, obj_in: UserCreate) -> User:
        """Create a new user with hashed password."""
        hashed_password = get_password_hash(obj_in.password)
        db_obj = self.model(
            email=obj_in.email,
            hashed_password=hashed_password,
            full_name=obj_in.full_name,
            role=obj_in.role,
            is_active=obj_in.is_active,
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def update(self, db: AsyncSession, *, db_obj: User, obj_in: UserUpdate) -> User:
        """Update an existing user, hashing new password if provided."""
        if obj_in.password:
            obj_in_data = obj_in.model_dump(exclude_unset=True)
            obj_in_data["hashed_password"] = get_password_hash(obj_in.password)
            del obj_in_data["password"] # Remove plain password from update data
            return await super().update(db, db_obj=db_obj, obj_in=obj_in_data)
        return await super().update(db, db_obj=db_obj, obj_in=obj_in)


crud_user = CRUDUser(User)
```