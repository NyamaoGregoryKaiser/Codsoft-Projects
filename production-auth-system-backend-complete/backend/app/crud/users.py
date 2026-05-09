from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.crud.base import CRUDBase
from app.models.user import User, Role
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash

class CRUDUser(CRUDBase[User]):
    """
    CRUD operations for User model.
    """
    async def get_by_email(self, db: AsyncSession, email: str) -> Optional[User]:
        """
        Retrieves a user by their email address, loading roles.
        :param db: The database session.
        :param email: The email address of the user.
        :return: The User instance if found, else None.
        """
        stmt = select(self.model).options(selectinload(self.model.roles)).where(self.model.email == email)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def create_user(self, db: AsyncSession, obj_in: UserCreate) -> User:
        """
        Creates a new user with a hashed password.
        :param db: The database session.
        :param obj_in: UserCreate schema object.
        :return: The created User instance.
        """
        hashed_password = get_password_hash(obj_in.password)
        db_obj = self.model(
            email=obj_in.email,
            hashed_password=hashed_password,
            full_name=obj_in.full_name,
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def update_user(self, db: AsyncSession, db_obj: User, obj_in: UserUpdate) -> User:
        """
        Updates an existing user.
        :param db: The database session.
        :param db_obj: The existing User instance to update.
        :param obj_in: UserUpdate schema object.
        :return: The updated User instance.
        """
        update_data = obj_in.model_dump(exclude_unset=True)
        return await self.update(db, db_obj, update_data)

    async def get_with_roles(self, db: AsyncSession, id: int) -> Optional[User]:
        """
        Retrieves a user by ID, explicitly loading their roles.
        :param db: The database session.
        :param id: The ID of the user.
        :return: The User instance with roles loaded, or None.
        """
        stmt = select(self.model).options(selectinload(self.model.roles)).where(self.model.id == id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_multi_with_roles(self, db: AsyncSession, skip: int = 0, limit: int = 100) -> List[User]:
        """
        Retrieves multiple users with pagination, loading their roles.
        :param db: The database session.
        :param skip: Number of records to skip.
        :param limit: Maximum number of records to return.
        :return: A list of User instances with roles loaded.
        """
        stmt = select(self.model).options(selectinload(self.model.roles)).offset(skip).limit(limit)
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def add_roles_to_user(self, db: AsyncSession, user: User, roles_to_add: List[Role]) -> User:
        """
        Adds roles to a user's existing roles.
        :param db: The database session.
        :param user: The User instance.
        :param roles_to_add: A list of Role instances to add.
        :return: The updated User instance.
        """
        user.roles.extend(roles_to_add)
        db.add(user)
        await db.commit()
        await db.refresh(user, attribute_names=["roles"]) # Refresh roles specifically
        return user

    async def set_user_roles(self, db: AsyncSession, user: User, new_roles: List[Role]) -> User:
        """
        Replaces all existing roles of a user with a new set of roles.
        :param db: The database session.
        :param user: The User instance.
        :param new_roles: A list of Role instances to set for the user.
        :return: The updated User instance.
        """
        user.roles = new_roles
        db.add(user)
        await db.commit()
        await db.refresh(user, attribute_names=["roles"])
        return user


user_crud = CRUDUser(User)
```