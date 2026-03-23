from typing import List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.crud.base import CRUDBase
from app.db.models import Project
from app.schemas.project import ProjectCreate, ProjectUpdate

class CRUDProject(CRUDBase[Project, ProjectCreate, ProjectUpdate]):
    async def get_multi_by_owner(
        self, db: AsyncSession, *, owner_id: int, skip: int = 0, limit: int = 100
    ) -> List[Project]:
        stmt = select(self.model).where(Project.owner_id == owner_id).offset(skip).limit(limit)
        result = await db.execute(stmt)
        return result.scalars().all()

    async def create_with_owner(
        self, db: AsyncSession, *, obj_in: ProjectCreate, owner_id: int
    ) -> Project:
        db_obj = self.model(
            title=obj_in.title,
            description=obj_in.description,
            owner_id=owner_id,
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

project = CRUDProject(Project)