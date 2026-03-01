from typing import Any, List, Optional

from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_active_user, get_current_admin_user
from app.crud.task import task as crud_task
from app.crud.project import project as crud_project
from app.crud.user import user as crud_user
from app.schemas.task import Task, TaskCreate, TaskUpdate, TaskDetail
from app.models.user import User
from app.models.task import TaskStatus, TaskPriority
from app.core.exceptions import NotFoundException, ForbiddenException, ConflictException

router = APIRouter()

@router.get("/by_project/{project_id}", response_model=List[Task], summary="Retrieve tasks for a specific project")
async def read_tasks_by_project(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Retrieve tasks for a given project.
    Access is restricted to the project owner or admin users.
    """
    project = await crud_project.get(db, id=project_id)
    if not project:
        raise NotFoundException(detail="Project not found")
    if not current_user.is_admin and project.owner_id != current_user.id:
        raise ForbiddenException(detail="Not enough permissions to view tasks for this project")

    tasks = await crud_task.get_multi_by_project(db, project_id=project_id, skip=skip, limit=limit)
    return tasks

@router.post("/", response_model=Task, status_code=status.HTTP_201_CREATED, summary="Create a new task")
async def create_task(
    *,
    db: AsyncSession = Depends(get_db),
    task_in: TaskCreate,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Create a new task within a specified project.
    Only the project owner or admin users can create tasks in that project.
    """
    project = await crud_project.get(db, id=task_in.project_id)
    if not project:
        raise NotFoundException(detail="Project not found")
    if not current_user.is_admin and project.owner_id != current_user.id:
        raise ForbiddenException(detail="Not enough permissions to create tasks in this project")
    
    if task_in.assigned_to_id:
        assigned_user = await crud_user.get(db, id=task_in.assigned_to_id)
        if not assigned_user:
            raise NotFoundException(detail="Assigned user not found")

    task = await crud_task.create(db, obj_in=task_in)
    return task

@router.get("/{task_id}", response_model=TaskDetail, summary="Retrieve task by ID")
async def read_task_by_id(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get a specific task by ID.
    Access is restricted to the project owner or admin users.
    """
    task = await crud_task.get_with_relations(db, task_id=task_id)
    if not task:
        raise NotFoundException(detail="Task not found")
    
    project = await crud_project.get(db, id=task.project_id)
    if not project: # Should not happen if data integrity is maintained
        raise NotFoundException(detail="Associated project not found")

    if not current_user.is_admin and project.owner_id != current_user.id:
        raise ForbiddenException(detail="Not enough permissions to access this task")
    
    return task

@router.put("/{task_id}", response_model=Task, summary="Update task by ID")
async def update_task(
    *,
    db: AsyncSession = Depends(get_db),
    task_id: int,
    task_in: TaskUpdate,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Update a task's information.
    Only the project owner or admin users can update a task in that project.
    """
    task = await crud_task.get(db, id=task_id)
    if not task:
        raise NotFoundException(detail="Task not found")
    
    project = await crud_project.get(db, id=task.project_id)
    if not project:
        raise NotFoundException(detail="Associated project not found")

    if not current_user.is_admin and project.owner_id != current_user.id:
        raise ForbiddenException(detail="Not enough permissions to update this task")

    if task_in.assigned_to_id is not None: # Can be set to None to unassign
        assigned_user = await crud_user.get(db, id=task_in.assigned_to_id)
        if not assigned_user:
            raise NotFoundException(detail="Assigned user not found")
    
    task = await crud_task.update(db, db_obj=task, obj_in=task_in)
    return task

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete task by ID")
async def delete_task(
    *,
    db: AsyncSession = Depends(get_db),
    task_id: int,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Delete a task. This will also delete all associated comments.
    Only the project owner or admin users can delete a task.
    """
    task = await crud_task.get(db, id=task_id)
    if not task:
        raise NotFoundException(detail="Task not found")

    project = await crud_project.get(db, id=task.project_id)
    if not project:
        raise NotFoundException(detail="Associated project not found")

    if not current_user.is_admin and project.owner_id != current_user.id:
        raise ForbiddenException(detail="Not enough permissions to delete this task")
    
    await crud_task.remove(db, id=task_id)
    return {"message": "Task deleted successfully"}

```