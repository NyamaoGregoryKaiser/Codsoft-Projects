from typing import Any, List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api import deps
from app.db.session import get_db
from app.schemas.comment import Comment, CommentCreate, CommentUpdate
from app.crud.comment import comment as crud_comment
from app.crud.task import task as crud_task
from app.crud.project import project as crud_project
from app.core.exceptions import EntityNotFoundException, ForbiddenException
from app.services.cache import invalidate_cache, cache
from app.services import notification

router = APIRouter()

@router.get("/task/{task_id}/", response_model=List[Comment])
@cache(expire=15) # Cache comments for 15 seconds
async def read_comments_by_task(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: deps.CurrentUser = Depends(deps.get_current_active_user_or_admin),
) -> Any:
    """
    Retrieve comments for a specific task.
    User must have access to the task to view its comments.
    """
    task = await crud_task.get(db, id=task_id)
    if not task:
        raise EntityNotFoundException("Task", task_id)

    # Check if user has access to the task (same logic as read_task_by_id)
    project = await crud_project.get(db, id=task.project_id)
    if not project:
        raise EntityNotFoundException("Project", task.project_id)

    can_view = (
        task.creator_id == current_user.id or
        task.assignee_id == current_user.id or
        project.owner_id == current_user.id or
        current_user.is_superuser or
        current_user.role == "admin"
    )
    if not can_view:
        raise ForbiddenException("Not authorized to access this task's comments.")

    comments = await crud_comment.get_multi_by_task(db, task_id=task_id, skip=skip, limit=limit)
    return comments

@router.post("/", response_model=Comment, status_code=status.HTTP_201_CREATED)
async def create_comment(
    *,
    db: AsyncSession = Depends(get_db),
    comment_in: CommentCreate,
    current_user: deps.CurrentUser = Depends(deps.get_current_active_user_or_admin),
) -> Any:
    """
    Create new comment. (User must have access to the task)
    """
    task = await crud_task.get(db, id=comment_in.task_id)
    if not task:
        raise EntityNotFoundException("Task", comment_in.task_id)

    # Check if user has access to the task
    project = await crud_project.get(db, id=task.project_id)
    if not project:
        raise EntityNotFoundException("Project", task.project_id)

    can_comment = (
        task.creator_id == current_user.id or
        task.assignee_id == current_user.id or
        project.owner_id == current_user.id or
        current_user.is_superuser or
        current_user.role == "admin"
    )
    if not can_comment:
        raise ForbiddenException("Not authorized to comment on this task.")

    comment = await crud_comment.create_with_author(db, obj_in=comment_in, author_id=current_user.id)
    await invalidate_cache(f"read_comments_by_task:{comment_in.task_id}")

    # Notify relevant users about the new comment
    affected_users = [task.creator_id, task.assignee_id, project.owner_id]
    affected_users = list(set([uid for uid in affected_users if uid is not None])) # Unique and non-None
    if current_user.id in affected_users:
        affected_users.remove(current_user.id) # Don't notify self

    await notification.notify_comment_added(
        task.id,
        task.title,
        current_user.full_name or current_user.email,
        affected_users,
        task_link=f"/tasks/{task.id}" # Example link
    )

    return comment

@router.put("/{comment_id}", response_model=Comment)
async def update_comment(
    *,
    db: AsyncSession = Depends(get_db),
    comment_id: int,
    comment_in: CommentUpdate,
    current_user: deps.CurrentUser = Depends(deps.get_current_active_user_or_admin),
) -> Any:
    """
    Update a comment. (Only author or Admin/Superuser)
    """
    comment = await crud_comment.get(db, id=comment_id)
    if not comment:
        raise EntityNotFoundException("Comment", comment_id)
    
    if not (comment.author_id == current_user.id or current_user.is_superuser or current_user.role == "admin"):
        raise ForbiddenException("Not authorized to update this comment.")
    
    updated_comment = await crud_comment.update(db, db_obj=comment, obj_in=comment_in)
    await invalidate_cache(f"read_comments_by_task:{updated_comment.task_id}")
    return updated_comment

@router.delete("/{comment_id}", response_model=Comment)
async def delete_comment(
    *,
    db: AsyncSession = Depends(get_db),
    comment_id: int,
    current_user: deps.CurrentUser = Depends(deps.get_current_active_user_or_admin), # Author, Project Owner, Admin/Superuser
) -> Any:
    """
    Delete a comment. (Only author, Project Owner, Admin/Superuser)
    """
    comment = await crud_comment.get(db, id=comment_id)
    if not comment:
        raise EntityNotFoundException("Comment", comment_id)
    
    task = await crud_task.get(db, id=comment.task_id)
    if not task:
        raise EntityNotFoundException("Task", comment.task_id) # Should not happen

    project = await crud_project.get(db, id=task.project_id)
    if not project:
        raise EntityNotFoundException("Project", task.project_id) # Should not happen

    can_delete = (
        comment.author_id == current_user.id or # Comment author
        project.owner_id == current_user.id or # Project owner
        current_user.is_superuser or
        current_user.role == "admin"
    )
    if not can_delete:
        raise ForbiddenException("Not authorized to delete this comment.")

    deleted_comment = await crud_comment.remove(db, id=comment_id)
    await invalidate_cache(f"read_comments_by_task:{deleted_comment.task_id}")
    return deleted_comment