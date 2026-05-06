```python
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from backend.core.database import get_db
from backend.core.dependencies import get_current_active_admin_user, get_current_user
from backend.services import crud
from backend.schemas.task import ScrapingTaskInDB, PaginatedScrapingResults, ScrapingResultInDB
from backend.schemas.common import PaginatedResponse
from backend.models.task import ScrapingTask, ScrapingResult, TaskStatus
from backend.models.user import User
from backend.models.scraper import ScraperConfig
from backend.core.logger import logger

router = APIRouter()

@router.get("/", response_model=PaginatedResponse[ScrapingTaskInDB], summary="Get all scraping tasks (or by user)")
async def read_tasks(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    status_filter: Optional[TaskStatus] = Query(None, description="Filter tasks by status"),
    scraper_id: Optional[int] = Query(None, description="Filter tasks by scraper ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    is_admin: bool = Depends(get_current_active_admin_user)
):
    """
    Retrieve all scraping tasks with pagination. Admins can see all tasks, regular users see only their own.
    Can filter by task status or scraper ID.
    """
    query = db.query(ScrapingTask).options(joinedload(ScrapingTask.config), joinedload(ScrapingTask.owner))
    
    if not is_admin:
        query = query.filter(ScrapingTask.owner_id == current_user.id)
    
    if status_filter:
        query = query.filter(ScrapingTask.status == status_filter)
    
    if scraper_id:
        # Verify scraper ownership if not admin
        if not is_admin:
            scraper = db.query(ScraperConfig).filter(ScraperConfig.id == scraper_id, ScraperConfig.owner_id == current_user.id).first()
            if not scraper:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access tasks for this scraper")
        query = query.filter(ScrapingTask.scraper_config_id == scraper_id)

    total = query.count()
    tasks = query.order_by(ScrapingTask.created_at.desc()).offset(skip).limit(limit).all()

    task_in_db_list = []
    for t in tasks:
        owner_username = t.owner.username if t.owner else None
        task_in_db_list.append(ScrapingTaskInDB.model_validate(t, update={'owner_username': owner_username}))

    logger.info(f"User {current_user.username} retrieved {len(tasks)} scraping tasks.")
    return PaginatedResponse(total=total, page=skip // limit + 1, page_size=limit, items=task_in_db_list)

@router.get("/{task_id}", response_model=ScrapingTaskInDB, summary="Get a scraping task by ID")
async def read_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    is_admin: bool = Depends(get_current_active_admin_user)
):
    """
    Retrieve a specific scraping task by ID.
    Users can only access their own tasks, unless they are an admin.
    """
    task = db.query(ScrapingTask).options(joinedload(ScrapingTask.config), joinedload(ScrapingTask.owner)).filter(ScrapingTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scraping task not found")
    if not is_admin and task.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this task")

    owner_username = task.owner.username if task.owner else None
    logger.info(f"User {current_user.username} retrieved task {task.id}.")
    return ScrapingTaskInDB.model_validate(task, update={'owner_username': owner_username})

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a scraping task")
async def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    is_admin: bool = Depends(get_current_active_admin_user)
):
    """
    Delete a scraping task by ID.
    Users can only delete their own tasks, unless they are an admin.
    Associated scraping results will also be deleted due to cascade.
    """
    task = crud.scraping_task.get(db, task_id)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scraping task not found")
    if not is_admin and task.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this task")
    
    crud.scraping_task.remove(db, task_id)
    logger.info(f"User {current_user.username} deleted task {task_id}.")
    return

@router.get("/{task_id}/results", response_model=PaginatedScrapingResults, summary="Get results for a specific task")
async def get_task_results(
    task_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    is_admin: bool = Depends(get_current_active_admin_user)
):
    """
    Retrieve scraping results for a specific task ID.
    Users can only access results from their own tasks, unless they are an admin.
    """
    task = db.query(ScrapingTask).filter(ScrapingTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scraping task not found")
    if not is_admin and task.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access results for this task")

    query = db.query(ScrapingResult).filter(ScrapingResult.scraping_task_id == task_id)
    total = query.count()
    results = query.offset(skip).limit(limit).all()
    
    logger.info(f"User {current_user.username} retrieved {len(results)} results for task {task_id}.")
    return PaginatedScrapingResults(
        total=total, page=skip // limit + 1, page_size=limit, items=[ScrapingResultInDB.model_validate(r) for r in results]
    )
```