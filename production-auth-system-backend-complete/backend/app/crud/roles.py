from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.crud.base import CRUDBase
from app.models.user import Role
from app.schemas.user import RoleCreate, RoleUpdate

class CRUDRole(CRUDBase[Role]):
    """
    CRUD operations for Role model.
    """
    async def get_by_name(self, db: AsyncSession, name: str) -> Optional[Role]:
        """
        Retrieves a role by its name.
        :param db: The database session.
        :param name: The name of the role.
        :return: The Role instance if found, else None.
        """
        stmt = select(self.model).where(self.model.name == name)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def create_role(self, db: AsyncSession, obj_in: RoleCreate) -> Role:
        """
        Creates a new role.
        :param db: The database session.
        :param obj_in: RoleCreate schema object.
        :return: The created Role instance.
        """
        return await self.create(db, obj_in.model_dump())

    async def update_role(self, db: AsyncSession, db_obj: Role, obj_in: RoleUpdate) -> Role:
        """
        Updates an existing role.
        :param db: The database session.
        :param db_obj: The existing Role instance to update.
        :param obj_in: RoleUpdate schema object.
        :return: The updated Role instance.
        """
        update_data = obj_in.model_dump(exclude_unset=True)
        return await self.update(db, db_obj, update_data)

    async def get_roles_by_ids(self, db: AsyncSession, role_ids: List[int]) -> List[Role]:
        """
        Retrieves a list of roles by their IDs.
        :param db: The database session.
        :param role_ids: A list of role IDs.
        :return: A list of Role instances.
        """
        stmt = select(self.model).where(self.model.id.in_(role_ids))
        result = await db.execute(stmt)
        return list(result.scalars().all())


role_crud = CRUDRole(Role)
```