```python
from typing import List, Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

from app.db.models import User, Post as DBPost
from app.schemas.post import PostCreate, PostUpdate, Post as PostSchema
from app.core.dependencies import get_db, get_current_active_user, get_current_admin_user
from app.services.post_service import get_post_by_id_service, get_all_posts_service, \
    create_post_service, update_post_service, delete_post_service
from app.core.exceptions import ForbiddenException, NotFoundException

router = APIRouter()


@router.get(
    "/",
    response_model=List[PostSchema],
    summary="Get all posts",
    description="Retrieve a list of all posts, accessible by any authenticated user.",
)
async def read_posts(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db_session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user) # Ensures authentication
):
    """
    Returns a list of all posts with pagination.
    - `skip`: Number of records to skip for pagination.
    - `limit`: Maximum number of records to return.
    """
    posts = await get_all_posts_service(db_session, skip=skip, limit=limit)
    return posts


@router.post(
    "/",
    response_model=PostSchema,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new post",
    description="Create a new post as the current authenticated user.",
)
async def create_new_post(
    post_in: PostCreate,
    db_session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Creates a new post owned by the currently authenticated user.
    - `title`: Title of the post.
    - `content`: Content of the post.
    """
    new_post = await create_post_service(db_session, post_in, current_user.id)
    return new_post


@router.get(
    "/{post_id}",
    response_model=PostSchema,
    summary="Get post by ID",
    description="Retrieve a single post by its ID, accessible by any authenticated user.",
)
async def read_post_by_id(
    post_id: int,
    db_session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user) # Ensures authentication
):
    """
    Retrieves a single post by its ID.
    """
    post = await get_post_by_id_service(db_session, post_id)
    return post


@router.put(
    "/{post_id}",
    response_model=PostSchema,
    summary="Update post by ID (Owner only)",
    description="Update an existing post by its ID. Only the post owner can update it.",
)
async def update_post_by_id(
    post_id: int,
    post_update: PostUpdate,
    db_session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Updates an existing post. Only the owner of the post can perform this action.
    - `post_id`: The ID of the post to update.
    - `title`: Optional new title.
    - `content`: Optional new content.
    """
    updated_post = await update_post_service(db_session, post_id, post_update, current_user.id)
    return updated_post


@router.delete(
    "/{post_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete post by ID (Owner or Admin)",
    description="Delete a post by its ID. Only the post owner or an administrator can delete it.",
)
async def delete_post_by_id(
    post_id: int,
    db_session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Deletes a post. Only the owner of the post or an administrator can perform this action.
    - `post_id`: The ID of the post to delete.
    """
    await delete_post_service(db_session, post_id, current_user.id, current_user.is_admin)
    return Response(status_code=status.HTTP_204_NO_CONTENT)

```