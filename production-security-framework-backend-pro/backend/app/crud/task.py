```python
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.crud.base import CRUDBase
from app.models.task import Task
from app.schemas.task import TaskCreate, TaskUpdate

class CRUDTask(CRUDBase[Task, TaskCreate, TaskUpdate]):
    async def get_multi_by_project(
        self, db: AsyncSession, *, project_id: int, skip: int = 0, limit: int = 100
    ) -> List[Task]:
        """Retrieve multiple tasks filtered by project."""
        stmt = select(self.model).filter(self.model.project_id == project_id).offset(skip).limit(limit)
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def get_with_relations(self, db: AsyncSession, *, task_id: int) -> Optional[Task]:
        """Retrieve a task with its project and assigned user."""
        stmt = select(self.model).options(
            selectinload(self.model.project),
            selectinload(self.model.assigned_to)
        ).filter(self.model.id == task_id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

crud_task = CRUDTask(Task)
```