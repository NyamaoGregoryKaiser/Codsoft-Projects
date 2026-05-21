from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload, joinedload

from app.crud.base import CRUDBase
from app.models.task_comment import TaskComment
from app.schemas.task_comment import TaskCommentCreate, TaskCommentUpdate

class CRUDTaskComment(CRUDBase[TaskComment, TaskCommentCreate, TaskCommentUpdate]):
    async def get_multi_by_task(
        self, db: AsyncSession, *, task_id: int, skip: int = 0, limit: int = 100
    ) -> List[TaskComment]:
        result = await db.execute(
            select(self.model)
            .filter(TaskComment.task_id == task_id)
            .offset(skip)
            .limit(limit)
            .options(joinedload(TaskComment.user)) # Eager load user who made the comment
            .order_by(TaskComment.created_at) # Order comments chronologically
        )
        return result.scalars().all()

    async def get_comment_with_user(self, db: AsyncSession, *, comment_id: int) -> Optional[TaskComment]:
        result = await db.execute(
            select(self.model)
            .filter(TaskComment.id == comment_id)
            .options(joinedload(TaskComment.user))
        )
        return result.scalar_one_or_none()


task_comment = CRUDTaskComment(TaskComment)