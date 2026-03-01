from typing import List, Optional

from sqlalchemy.future import select
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
        """Retrieve multiple projects owned by a specific user."""
        result = await db.execute(
            select(Project)
            .filter(Project.owner_id == owner_id)
            .offset(skip)
            .limit(limit)
            .order_by(Project.created_at.desc())
        )
        return result.scalars().all()

    async def create_with_owner(
        self, db: AsyncSession, *, obj_in: ProjectCreate, owner_id: int
    ) -> Project:
        """Create a new project with a specified owner."""
        db_obj = Project(
            title=obj_in.title,
            description=obj_in.description,
            owner_id=owner_id,
        )
        db.add(db_obj)
        await db.flush()
        await db.refresh(db_obj)
        return db_obj

    async def get_with_tasks(self, db: AsyncSession, *, project_id: int) -> Optional[Project]:
        """Retrieve a project along with its associated tasks."""
        result = await db.execute(
            select(Project)
            .options(selectinload(Project.tasks))
            .filter(Project.id == project_id)
        )
        return result.scalar_one_or_none()


project = CRUDProject(Project)
```