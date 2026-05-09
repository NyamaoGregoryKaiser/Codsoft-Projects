```python
from typing import List, Optional

from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

from app.crud.post import get_post_by_id, get_all_posts, get_posts_by_user, create_post, update_post, delete_post
from app.db.models import Post
from app.schemas.post import PostCreate, PostUpdate
from app.core.exceptions import NotFoundException, ForbiddenException


async def get_post_by_id_service(db_session: AsyncSession, post_id: int) -> Post:
    """
    Service to get a post by ID.
    """
    post = await get_post_by_id(db_session, post_id)
    if not post:
        raise NotFoundException(detail=f"Post with ID {post_id} not found.")
    return post


async def get_all_posts_service(db_session: AsyncSession, skip: int = 0, limit: int = 100) -> List[Post]:
    """
    Service to get all posts.
    """
    return await get_all_posts(db_session, skip, limit)


async def get_user_posts_service(db_session: AsyncSession, user_id: int, skip: int = 0, limit: int = 100) -> List[Post]:
    """
    Service to get posts by a specific user.
    """
    return await get_posts_by_user(db_session, user_id, skip, limit)


async def create_post_service(db_session: AsyncSession, post_in: PostCreate, owner_id: int) -> Post:
    """
    Service to create a new post.
    """
    return await create_post(db_session, post_in, owner_id)


async def update_post_service(db_session: AsyncSession, post_id: int, post_update: PostUpdate, current_user_id: int) -> Post:
    """
    Service to update an existing post, ensuring ownership.
    """
    post = await get_post_by_id(db_session, post_id)
    if not post:
        raise NotFoundException(detail=f"Post with ID {post_id} not found.")
    if post.owner_id != current_user_id:
        raise ForbiddenException(detail="You are not authorized to update this post.")

    updated_post = await update_post(db_session, post_id, post_update)
    if not updated_post:
        # Should not happen if post was found, but as a safeguard
        raise NotFoundException(detail=f"Post with ID {post_id} not found during update.")
    return updated_post


async def delete_post_service(db_session: AsyncSession, post_id: int, current_user_id: int, is_admin: bool) -> bool:
    """
    Service to delete a post, ensuring ownership or admin privileges.
    """
    post = await get_post_by_id(db_session, post_id)
    if not post:
        raise NotFoundException(detail=f"Post with ID {post_id} not found for deletion.")
    if post.owner_id != current_user_id and not is_admin:
        raise ForbiddenException(detail="You are not authorized to delete this post.")

    deleted = await delete_post(db_session, post_id)
    if not deleted:
        raise NotFoundException(detail=f"Post with ID {post_id} not found for deletion.")
    return deleted

```