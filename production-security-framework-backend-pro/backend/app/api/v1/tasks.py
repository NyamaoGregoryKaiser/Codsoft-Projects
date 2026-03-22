```python
from typing import List, Any
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger
from fastapi_cache.decorator import cache

from app.core.db import get_db
from app.crud.task import crud_task
from app.crud.project import crud_project
from app.crud.user import crud_user
from app.schemas.task import Task as TaskSchema, TaskCreate, TaskUpdate
from app.models.user import User
from app.models.task import Task
from app.dependencies.auth import get_current_active_user
from app.dependencies.permissions import verify_project_owner, verify_task_access
from app.exceptions.custom_exceptions import EntityNotFoundException, BadRequestException

router = APIRouter()

@router.get("/by-project/{project_id}", response_model=List[TaskSchema])
@cache(expire=15) # Cache tasks for 15 seconds
async def read_tasks_by_project(
    project_id: int,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Retrieve tasks for a specific project.
    Only project owner or admin can access.
    """
    project = await crud_project.get(db, project_id)
    if not project:
        raise EntityNotFoundException("Project not found")
    
    if project.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access tasks for this project"
        )
    
    tasks = await crud_task.get_multi_by_project(db, project_id=project_id, skip=skip, limit=limit)
    return tasks

@router.post("/", response_model=TaskSchema, status_code=status.HTTP_201_CREATED)
async def create_task(
    task_in: TaskCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Create a new task within a project.
    Only project owner or admin can create tasks for a project.
    """
    project = await crud_project.get(db, task_in.project_id)
    if not project:
        raise EntityNotFoundException("Project not found")
    
    if project.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create tasks for this project"
        )
    
    if task_in.assigned_to_id:
        assigned_user = await crud_user.get(db, task_in.assigned_to_id)
        if not assigned_user:
            raise BadRequestException(f"Assigned user with ID {task_in.assigned_to_id} not found.")

    task = await crud_task.create(db, obj_in=task_in)
    logger.info(f"User {current_user.email} created task: {task.title} (ID: {task.id}) in project {task.project_id}")
    return task

@router.get("/{task_id}", response_model=TaskSchema)
async def read_task(
    task: Task = Depends(verify_task_access) # Uses permission dependency
) -> Any:
    """
    Get a specific task by ID. Accessible by project owner, assigned user, or admin.
    """
    return task

@router.put("/{task_id}", response_model=TaskSchema)
async def update_task(
    task_in: TaskUpdate,
    task: Task = Depends(verify_task_access), # Uses permission dependency
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Update a specific task by ID. Accessible by project owner, assigned user, or admin.
    """
    if task_in.assigned_to_id:
        assigned_user = await crud_user.get(db, task_in.assigned_to_id)
        if not assigned_user:
            raise BadRequestException(f"Assigned user with ID {task_in.assigned_to_id} not found.")

    updated_task = await crud_task.update(db, db_obj=task, obj_in=task_in)
    logger.info(f"Task {updated_task.title} (ID: {updated_task.id}) updated by authorized user.")
    return updated_task

@router.delete("/{task_id}", response_model=TaskSchema)
async def delete_task(
    task: Task = Depends(verify_task_access), # Uses permission dependency
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Delete a specific task by ID. Accessible by project owner or admin.
    Assigned users cannot delete tasks unless they are also the project owner or admin.
    """
    # Double check for deletion permission: Only project owner or admin can delete
    current_user: User = Depends(get_current_active_user) # Re-evaluate current_user here if needed
    if task.project.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this task"
        )

    deleted_task = await crud_task.remove(db, id=task.id)
    logger.info(f"Task {deleted_task.title} (ID: {deleted_task.id}) deleted by authorized user.")
    return deleted_task
```