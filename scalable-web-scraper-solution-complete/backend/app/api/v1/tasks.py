from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.crud.task import task as crud_task
from app.schemas.task import ScrapingTask, ScrapingTaskCreate, ScrapingTaskUpdate, ScrapingTaskWithResults
from app.core.security import get_current_user_payload
from app.schemas.token import TokenData
from app.models.user import UserRole
from app.services.task_scheduler import task_scheduler
from datetime import datetime, timedelta, timezone
from app.models.task import TaskStatus
from app.middleware.error_handler import CustomBusinessException
from fastapi_cache.decorator import cache
from loguru import logger

router = APIRouter(prefix="/tasks", tags=["Scraping Tasks"])

# Helper function for authorization (can be refactored into a dependency if more complex)
def check_task_ownership(db_task: ScrapingTask, current_user_id: int, current_user_role: UserRole):
    if db_task.owner_id != current_user_id and current_user_role != UserRole.ADMIN:
        logger.warning(f"User {current_user_id} (role: {current_user_role}) attempted to access task {db_task.id} owned by {db_task.owner_id}.")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this task."
        )

@router.post("/", response_model=ScrapingTask, status_code=status.HTTP_201_CREATED,
             description="Create a new scraping task.")
async def create_scraping_task(
    task_in: ScrapingTaskCreate,
    current_user_payload: TokenData = Depends(get_current_user_payload),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new scraping task owned by the current user.
    Initializes next_run_at and schedules the first run.
    """
    db_task = await crud_task.create(db, obj_in=task_in.model_dump(exclude_unset=True) | {"owner_id": current_user_payload.id})
    
    # Calculate initial next_run_at based on frequency or immediate
    now = datetime.now(timezone.utc)
    if db_task.frequency_seconds > 0:
        db_task.next_run_at = now + timedelta(seconds=db_task.frequency_seconds)
    else:
        # If frequency is 0 or negative (should be caught by Pydantic, but fallback)
        db_task.next_run_at = now # Run immediately
    
    await db.commit() # Commit again to save next_run_at

    # Schedule the initial scrape via Celery
    task_scheduler.schedule_scrape_task(db_task.id, eta=db_task.next_run_at)
    
    logger.info(f"User {current_user_payload.id} created new task {db_task.id}: {db_task.name}. Scheduled for {db_task.next_run_at}")
    return db_task

@router.get("/", response_model=List[ScrapingTask],
            description="Retrieve a list of scraping tasks for the current user (or all if admin).")
@cache(expire=60) # Cache results for 60 seconds
async def read_scraping_tasks(
    current_user_payload: TokenData = Depends(get_current_user_payload),
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    """
    Retrieve multiple scraping tasks.
    Admins can see all tasks, regular users only their own.
    """
    if current_user_payload.role == UserRole.ADMIN:
        tasks = await crud_task.get_multi(db, skip=skip, limit=limit)
    else:
        tasks = await crud_task.get_tasks_by_owner(db, owner_id=current_user_payload.id, skip=skip, limit=limit)
    return tasks

@router.get("/{task_id}", response_model=ScrapingTaskWithResults,
            description="Retrieve a single scraping task by ID, including its results.")
async def read_scraping_task(
    task_id: int,
    current_user_payload: TokenData = Depends(get_current_user_payload),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve a scraping task by ID.
    """
    db_task = await crud_task.get(db, id=task_id)
    if not db_task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    
    check_task_ownership(db_task, current_user_payload.id, current_user_payload.role)
    
    # Eager load results for the response model
    # Note: This is simplified. For large number of results, pagination is better.
    from sqlalchemy.orm import selectinload
    from app.models.task import ScrapingTask as DBScrapingTask
    result = await db.execute(
        select(DBScrapingTask)
        .options(selectinload(DBScrapingTask.results))
        .filter(DBScrapingTask.id == task_id)
    )
    db_task_with_results = result.scalar_one_or_none()

    return db_task_with_results

@router.put("/{task_id}", response_model=ScrapingTask,
            description="Update an existing scraping task.")
async def update_scraping_task(
    task_id: int,
    task_in: ScrapingTaskUpdate,
    current_user_payload: TokenData = Depends(get_current_user_payload),
    db: AsyncSession = Depends(get_db)
):
    """
    Update an existing scraping task.
    """
    db_task = await crud_task.get(db, id=task_id)
    if not db_task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    
    check_task_ownership(db_task, current_user_payload.id, current_user_payload.role)
    
    # If frequency_seconds is updated, recalculate next_run_at
    if task_in.frequency_seconds is not None and task_in.frequency_seconds != db_task.frequency_seconds:
        now = datetime.now(timezone.utc)
        db_task.next_run_at = now + timedelta(seconds=task_in.frequency_seconds)
        
    updated_task = await crud_task.update(db, db_obj=db_task, obj_in=task_in)
    logger.info(f"User {current_user_payload.id} updated task {updated_task.id}.")
    return updated_task

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT,
               description="Delete a scraping task.")
async def delete_scraping_task(
    task_id: int,
    current_user_payload: TokenData = Depends(get_current_user_payload),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a scraping task.
    """
    db_task = await crud_task.get(db, id=task_id)
    if not db_task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    
    check_task_ownership(db_task, current_user_payload.id, current_user_payload.role)
    
    await crud_task.delete(db, id=task_id)
    logger.info(f"User {current_user_payload.id} deleted task {task_id}.")
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.post("/{task_id}/run", response_model=ScrapingTask,
             description="Manually trigger an immediate run of a scraping task.")
async def trigger_scraping_task(
    task_id: int,
    current_user_payload: TokenData = Depends(get_current_user_payload),
    db: AsyncSession = Depends(get_db)
):
    """
    Manually trigger an immediate run of a scraping task.
    """
    db_task = await crud_task.get(db, id=task_id)
    if not db_task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    
    check_task_ownership(db_task, current_user_payload.id, current_user_payload.role)

    # Immediately schedule the task via Celery
    task_scheduler.schedule_scrape_task(db_task.id)
    
    # Update task status to PENDING and next_run_at for subsequent scheduling
    now = datetime.now(timezone.utc)
    db_task.status = TaskStatus.PENDING # Or RUNNING if you want to immediately reflect it
    db_task.next_run_at = now + timedelta(seconds=db_task.frequency_seconds) # Set for next scheduled run
    db_task = await crud_task.update(db, db_obj=db_task, obj_in={
        "status": TaskStatus.PENDING,
        "next_run_at": now + timedelta(seconds=db_task.frequency_seconds)
    })

    logger.info(f"User {current_user_payload.id} manually triggered task {task_id}.")
    return db_task

```