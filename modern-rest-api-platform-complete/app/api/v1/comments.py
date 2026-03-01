from typing import Any, List

from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_active_user, get_current_admin_user
from app.crud.comment import comment as crud_comment
from app.crud.task import task as crud_task
from app.crud.project import project as crud_project
from app.schemas.comment import Comment, CommentCreate, CommentUpdate
from app.models.user import User
from app.core.exceptions import NotFoundException, ForbiddenException

router = APIRouter()

@router.get("/by_task/{task_id}", response_model=List[Comment], summary="Retrieve comments for a specific task")
async def read_comments_by_task(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Retrieve comments for a given task.
    Access is restricted to the project owner or admin users.
    """
    task = await crud_task.get(db, id=task_id)
    if not task:
        raise NotFoundException(detail="Task not found")
    
    project = await crud_project.get(db, id=task.project_id)
    if not project: # Should not happen if data integrity is maintained
        raise NotFoundException(detail="Associated project not found")

    if not current_user.is_admin and project.owner_id != current_user.id:
        raise ForbiddenException(detail="Not enough permissions to view comments for this task")

    comments = await crud_comment.get_multi_by_task(db, task_id=task_id, skip=skip, limit=limit)
    return comments

@router.post("/", response_model=Comment, status_code=status.HTTP_201_CREATED, summary="Add a new comment to a task")
async def create_comment(
    *,
    db: AsyncSession = Depends(get_db),
    comment_in: CommentCreate,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Add a new comment to a specified task.
    Only the project owner or admin users can add comments to a task in that project.
    """
    task = await crud_task.get(db, id=comment_in.task_id)
    if not task:
        raise NotFoundException(detail="Task not found")
    
    project = await crud_project.get(db, id=task.project_id)
    if not project:
        raise NotFoundException(detail="Associated project not found")

    if not current_user.is_admin and project.owner_id != current_user.id:
        raise ForbiddenException(detail="Not enough permissions to add comments to this task")

    comment = await crud_comment.create_with_author(db, obj_in=comment_in, author_id=current_user.id)
    return await crud_comment.get_with_author(db, comment_id=comment.id) # Return with author details

@router.put("/{comment_id}", response_model=Comment, summary="Update comment by ID")
async def update_comment(
    *,
    db: AsyncSession = Depends(get_db),
    comment_id: int,
    comment_in: CommentUpdate,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Update a comment's content.
    Only the comment author or admin users can update a comment.
    """
    comment = await crud_comment.get(db, id=comment_id)
    if not comment:
        raise NotFoundException(detail="Comment not found")
    
    if not current_user.is_admin and comment.author_id != current_user.id:
        raise ForbiddenException(detail="Not enough permissions to update this comment")
    
    comment = await crud_comment.update(db, db_obj=comment, obj_in=comment_in)
    return await crud_comment.get_with_author(db, comment_id=comment.id)

@router.delete("/{comment_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete comment by ID")
async def delete_comment(
    *,
    db: AsyncSession = Depends(get_db),
    comment_id: int,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Delete a comment.
    Only the comment author or admin users can delete a comment.
    """
    comment = await crud_comment.get(db, id=comment_id)
    if not comment:
        raise NotFoundException(detail="Comment not found")
    
    # Also check if the user is the project owner
    task = await crud_task.get(db, id=comment.task_id)
    project = await crud_project.get(db, id=task.project_id)

    if not current_user.is_admin and comment.author_id != current_user.id and project.owner_id != current_user.id:
        raise ForbiddenException(detail="Not enough permissions to delete this comment")
    
    await crud_comment.remove(db, id=comment_id)
    return {"message": "Comment deleted successfully"}
```