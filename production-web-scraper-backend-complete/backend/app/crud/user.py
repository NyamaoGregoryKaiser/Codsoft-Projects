from typing import Any, Dict, List, Type, Union

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import get_password_hash
from app.crud.base import CRUDBase
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate

class CRUDUser(CRUDBase[User, UserCreate, UserUpdate]):
    async def get_by_email(self, db: AsyncSession, *, email: str) -> User | None:
        """Retrieve a user by email address."""
        stmt = select(self.model).where(self.model.email == email)
        result = await db.execute(stmt)
        return result.scalars().first()

    async def create(self, db: AsyncSession, *, obj_in: UserCreate, owner_id: int | None = None) -> User:
        """Create a new user with hashed password."""
        # Hash the password before storing
        hashed_password = get_password_hash(obj_in.password)
        db_obj = self.model(
            email=obj_in.email,
            hashed_password=hashed_password,
            is_active=True,
            is_superuser=obj_in.is_superuser,
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def update(
        self, db: AsyncSession, *, db_obj: User, obj_in: Union[UserUpdate, Dict[str, Any]]
    ) -> User:
        """Update an existing user, hashing password if provided."""
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.model_dump(exclude_unset=True)

        if "password" in update_data and update_data["password"]:
            hashed_password = get_password_hash(update_data["password"])
            del update_data["password"]
            update_data["hashed_password"] = hashed_password
        
        return await super().update(db, db_obj=db_obj, obj_in=update_data)

    async def is_superuser(self, user: User) -> bool:
        """Check if a user is a superuser."""
        return user.is_superuser

    async def is_active(self, user: User) -> bool:
        """Check if a user is active."""
        return user.is_active

user = CRUDUser(User)

# Helper function for seeding initial superuser
async def seed_initial_superuser():
    """Seeds an initial superuser into the database if one does not exist."""
    from app.core.database import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        existing_admin = await user.get_by_email(db, email=settings.FIRST_SUPERUSER_EMAIL)
        if not existing_admin:
            print(f"Seeding initial superuser: {settings.FIRST_SUPERUSER_EMAIL}")
            user_in = UserCreate(
                email=settings.FIRST_SUPERUSER_EMAIL,
                password=settings.FIRST_SUPERUSER_PASSWORD,
                is_superuser=True
            )
            await user.create(db, obj_in=user_in)
            print("Initial superuser created.")
        else:
            print(f"Superuser '{settings.FIRST_SUPERUSER_EMAIL}' already exists.")

```
---