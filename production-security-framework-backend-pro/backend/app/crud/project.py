```python
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.crud.base import CRUDBase
from app.models.project import Project
from app.models.user import User
from app.schemas.project import ProjectCreate, ProjectUpdate

class CRUDProject(CRUDBase[Project, ProjectCreate, ProjectUpdate]):
    async def get_multi_by_owner(
        self, db: AsyncSession, *, owner_id: int, skip: int = 0, limit: int = 100
    ) -> List[Project]:
        """Retrieve multiple projects filtered by owner."""
        stmt = select(self.model).filter(self.model.owner_id == owner_id).offset(skip).limit(limit)
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def get_with_owner(self, db: AsyncSession, *, project_id: int) -> Optional[Project]:
        """Retrieve a project and its owner."""
        stmt = select(self.model).options(selectinload(self.model.owner)).filter(self.model.id == project_id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def create_with_owner(
        self, db: AsyncSession, *, obj_in: ProjectCreate, owner_id: int
    ) -> Project:
        """Create a project and associate it with an owner."""
        db_obj = self.model(
            title=obj_in.title,
            description=obj_in.description,
            owner_id=owner_id,
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj


crud_project = CRUDProject(Project)
```