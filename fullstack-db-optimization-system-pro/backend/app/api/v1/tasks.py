from typing import List, Any
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.task import Task, TaskCreate, TaskUpdate
from app.db.session import get_async_session
from app.services.task_service import task_service
from app.api.v1.dependencies import CurrentUser, AdminUser, DBSession
from loguru import logger

router = APIRouter()

@router.post("/", response_model=Task, status_code=status.HTTP_201_CREATED, summary="Create a new optimization task")
async def create_new_task(
    task_in: TaskCreate,
    db: DBSession,
    current_user: CurrentUser
) -> Any:
    """
    Create a new optimization task.
    The current user must own the target database.
    `assigned_to_id` will default to current user if not specified.
    """
    return await task_service.create_task(db, task_in, current_user)

@router.get("/", response_model=List[Task], summary="Retrieve tasks assigned to current user or all (Admin)")
async def read_tasks(
    db: DBSession,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100
) -> Any:
    """
    Retrieve tasks. If the current user is an admin, retrieve all tasks.
    Otherwise, retrieve only tasks assigned to the current user.
    """
    if current_user.is_admin:
        return await task_service.get_all_tasks(db, skip=skip, limit=limit)
    return await task_service.get_user_tasks(db, current_user.id, skip=skip, limit=limit)

@router.get("/{task_id}", response_model=Task, summary="Retrieve a task by ID")
async def read_task_by_id(
    task_id: int,
    db: DBSession,
    current_user: CurrentUser
) -> Any:
    """
    Retrieve a specific task by ID.
    Accessible if current user owns the database, is assigned to the task, or is an admin.
    """
    task = await task_service.get_task(db, task_id)
    # Service layer handles full authorization check
    db_instance = await db.get(task.database.__class__, task.database_id)
    if not ( (db_instance and db_instance.owner_id == current_user.id) or task.assigned_to_id == current_user.id or current_user.is_admin ):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this task.")
    return task

@router.put("/{task_id}", response_model=Task, summary="Update an optimization task by ID")
async def update_existing_task(
    task_id: int,
    task_in: TaskUpdate,
    db: DBSession,
    current_user: CurrentUser
) -> Any:
    """
    Update details of an existing optimization task.
    Accessible if current user owns the database, is assigned to the task, or is an admin.
    """
    return await task_service.update_task(db, task_id, task_in, current_user)

@router.delete("/{task_id}", response_model=Task, summary="Delete an optimization task by ID")
async def delete_existing_task(
    task_id: int,
    db: DBSession,
    current_user: CurrentUser
) -> Any:
    """
    Delete an optimization task.
    Accessible if current user owns the database or is an admin.
    """
    return await task_service.delete_task(db, task_id, current_user)