from typing import List, Optional

from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.crud.base import CRUDBase
from app.models.task import Task
from app.schemas.task import TaskCreate, TaskUpdate

class CRUDTask(CRUDBase[Task, TaskCreate, TaskUpdate]):
    async def get_multi_by_project(
        self, db: AsyncSession, *, project_id: int, skip: int = 0, limit: int = 100
    ) -> List[Task]:
        """Retrieve multiple tasks belonging to a specific project."""
        result = await db.execute(
            select(Task)
            .filter(Task.project_id == project_id)
            .offset(skip)
            .limit(limit)
            .order_by(Task.created_at.desc())
        )
        return result.scalars().all()

    async def get_with_relations(self, db: AsyncSession, *, task_id: int) -> Optional[Task]:
        """Retrieve a task along with its assigned user and comments."""
        result = await db.execute(
            select(Task)
            .options(selectinload(Task.assigned_to), selectinload(Task.comments).selectinload(Task.comments.property.mapper.class_.author))
            .filter(Task.id == task_id)
        )
        return result.scalar_one_or_none()


task = CRUDTask(Task)
```