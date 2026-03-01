from typing import List, Optional

from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.crud.base import CRUDBase
from app.models.comment import Comment
from app.schemas.comment import CommentCreate, CommentUpdate

class CRUDComment(CRUDBase[Comment, CommentCreate, CommentUpdate]):
    async def get_multi_by_task(
        self, db: AsyncSession, *, task_id: int, skip: int = 0, limit: int = 100
    ) -> List[Comment]:
        """Retrieve multiple comments belonging to a specific task."""
        result = await db.execute(
            select(Comment)
            .options(selectinload(Comment.author)) # Eager load author for comments
            .filter(Comment.task_id == task_id)
            .offset(skip)
            .limit(limit)
            .order_by(Comment.created_at.asc())
        )
        return result.scalars().all()

    async def create_with_author(
        self, db: AsyncSession, *, obj_in: CommentCreate, author_id: int
    ) -> Comment:
        """Create a new comment with a specified author."""
        db_obj = Comment(
            content=obj_in.content,
            task_id=obj_in.task_id,
            author_id=author_id,
        )
        db.add(db_obj)
        await db.flush()
        await db.refresh(db_obj)
        return db_obj

    async def get_with_author(self, db: AsyncSession, *, comment_id: int) -> Optional[Comment]:
        """Retrieve a comment along with its author."""
        result = await db.execute(
            select(Comment)
            .options(selectinload(Comment.author))
            .filter(Comment.id == comment_id)
        )
        return result.scalar_one_or_none()

comment = CRUDComment(Comment)
```