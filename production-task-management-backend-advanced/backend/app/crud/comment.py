from typing import List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.crud.base import CRUDBase
from app.db.models import Comment
from app.schemas.comment import CommentCreate, CommentUpdate

class CRUDComment(CRUDBase[Comment, CommentCreate, CommentUpdate]):
    async def get_multi_by_task(
        self, db: AsyncSession, *, task_id: int, skip: int = 0, limit: int = 100
    ) -> List[Comment]:
        stmt = select(self.model).where(Comment.task_id == task_id).offset(skip).limit(limit)
        result = await db.execute(stmt)
        return result.scalars().all()

    async def create_with_author(
        self, db: AsyncSession, *, obj_in: CommentCreate, author_id: int
    ) -> Comment:
        db_obj = self.model(
            content=obj_in.content,
            task_id=obj_in.task_id,
            author_id=author_id
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

comment = CRUDComment(Comment)