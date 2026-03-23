from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.crud.base import CRUDBase
from app.db.models import Task
from app.schemas.task import TaskCreate, TaskUpdate

class CRUDTask(CRUDBase[Task, TaskCreate, TaskUpdate]):
    async def get_multi_by_project(
        self, db: AsyncSession, *, project_id: int, skip: int = 0, limit: int = 100
    ) -> List[Task]:
        stmt = select(self.model).where(Task.project_id == project_id).offset(skip).limit(limit)
        result = await db.execute(stmt)
        return result.scalars().all()

    async def create_with_creator(
        self, db: AsyncSession, *, obj_in: TaskCreate, creator_id: int
    ) -> Task:
        db_obj = self.model(
            title=obj_in.title,
            description=obj_in.description,
            status=obj_in.status,
            priority=obj_in.priority,
            due_date=obj_in.due_date,
            project_id=obj_in.project_id,
            assignee_id=obj_in.assignee_id,
            creator_id=creator_id
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

task = CRUDTask(Task)