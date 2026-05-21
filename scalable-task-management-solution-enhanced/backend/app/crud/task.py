from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload, joinedload

from app.crud.base import CRUDBase
from app.models.task import Task
from app.schemas.task import TaskCreate, TaskUpdate

class CRUDTask(CRUDBase[Task, TaskCreate, TaskUpdate]):
    async def get_multi_by_project(
        self, db: AsyncSession, *, project_id: int, skip: int = 0, limit: int = 100
    ) -> List[Task]:
        result = await db.execute(
            select(self.model)
            .filter(Task.project_id == project_id)
            .offset(skip)
            .limit(limit)
            .options(joinedload(Task.assignee), joinedload(Task.creator)) # Eager load assignee and creator
        )
        return result.scalars().all()

    async def get_multi_by_assignee(
        self, db: AsyncSession, *, assignee_id: int, skip: int = 0, limit: int = 100
    ) -> List[Task]:
        result = await db.execute(
            select(self.model)
            .filter(Task.assignee_id == assignee_id)
            .offset(skip)
            .limit(limit)
            .options(joinedload(Task.project), joinedload(Task.creator)) # Eager load project and creator
        )
        return result.scalars().all()

    async def get_task_details(self, db: AsyncSession, *, task_id: int) -> Optional[Task]:
        """
        Retrieves a task with its related project, assignee, and creator.
        """
        result = await db.execute(
            select(self.model)
            .filter(Task.id == task_id)
            .options(
                joinedload(Task.project),
                joinedload(Task.assignee),
                joinedload(Task.creator),
                selectinload(Task.comments).joinedload(TaskComment.user) # Eager load comments and their users
            )
        )
        return result.scalar_one_or_none()

    async def get_multi_tasks(self, db: AsyncSession, *, skip: int = 0, limit: int = 100) -> List[Task]:
        """
        Retrieves multiple tasks with related project, assignee, and creator for a general list.
        """
        result = await db.execute(
            select(self.model)
            .offset(skip)
            .limit(limit)
            .options(
                joinedload(Task.project),
                joinedload(Task.assignee),
                joinedload(Task.creator)
            )
        )
        return result.scalars().all()

task = CRUDTask(Task)

# Import TaskComment here to avoid circular imports, as it's only used for eager loading
from app.models.task_comment import TaskComment