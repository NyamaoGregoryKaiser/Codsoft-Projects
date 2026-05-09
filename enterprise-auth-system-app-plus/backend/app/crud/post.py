```python
from typing import List, Optional

from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from loguru import logger

from app.db.models import Post
from app.schemas.post import PostCreate, PostUpdate


async def get_post_by_id(db_session: AsyncSession, post_id: int) -> Optional[Post]:
    """Retrieve a post by ID, with its owner."""
    result = await db_session.execute(
        select(Post).options(selectinload(Post.owner)).filter(Post.id == post_id)
    )
    return result.scalar_one_or_none()


async def get_all_posts(db_session: AsyncSession, skip: int = 0, limit: int = 100) -> List[Post]:
    """Retrieve all posts with pagination, including their owners."""
    result = await db_session.execute(
        select(Post).options(selectinload(Post.owner)).offset(skip).limit(limit)
    )
    return result.scalars().all()


async def get_posts_by_user(db_session: AsyncSession, owner_id: int, skip: int = 0, limit: int = 100) -> List[Post]:
    """Retrieve posts by a specific user with pagination."""
    result = await db_session.execute(
        select(Post).options(selectinload(Post.owner)).filter(Post.owner_id == owner_id).offset(skip).limit(limit)
    )
    return result.scalars().all()


async def create_post(db_session: AsyncSession, post_in: PostCreate, owner_id: int) -> Post:
    """Create a new post."""
    db_post = Post(
        title=post_in.title,
        content=post_in.content,
        owner_id=owner_id,
    )
    db_session.add(db_post)
    await db_session.commit()
    await db_session.refresh(db_post)
    # Load owner for the response
    db_post.owner = await db_session.get(Post.owner.property.mapper.class_, db_post.owner_id)
    logger.info(f"Post created: {db_post.title} by user {owner_id}")
    return db_post


async def update_post(db_session: AsyncSession, post_id: int, post_update: PostUpdate) -> Optional[Post]:
    """Update an existing post."""
    db_post = await get_post_by_id(db_session, post_id)
    if not db_post:
        return None

    update_data = post_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_post, key, value)

    db_session.add(db_post)
    await db_session.commit()
    await db_session.refresh(db_post)
    # Reload owner for the response if it's not eager loaded by previous get_post_by_id
    if not db_post.owner:
        db_post.owner = await db_session.get(Post.owner.property.mapper.class_, db_post.owner_id)
    logger.info(f"Post updated: {db_post.title} (ID: {db_post.id})")
    return db_post


async def delete_post(db_session: AsyncSession, post_id: int) -> bool:
    """Delete a post."""
    result = await db_session.execute(delete(Post).where(Post.id == post_id))
    if result.rowcount > 0:
        await db_session.commit()
        logger.info(f"Post deleted: ID {post_id}")
        return True
    return False

```