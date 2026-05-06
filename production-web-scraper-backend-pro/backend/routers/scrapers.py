```python
import json
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.core.database import get_db
from backend.core.dependencies import get_current_active_admin_user, get_current_user
from backend.services import crud, scheduler
from backend.schemas.scraper import ScraperConfigCreate, ScraperConfigUpdate, ScraperConfigInDB
from backend.schemas.task import ScrapingTaskInDB
from backend.schemas.common import PaginatedResponse
from backend.models.scraper import ScraperConfig
from backend.models.user import User
from backend.models.task import ScrapingTask, TaskStatus
from backend.core.logger import logger
import asyncio
from backend.services.scraper_engine import scrape_website

router = APIRouter()

@router.post("/", response_model=ScraperConfigInDB, status_code=status.HTTP_201_CREATED, summary="Create a new scraper config")
async def create_scraper(
    scraper_in: ScraperConfigCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new web scraper configuration.
    """
    # Convert list of SelectorConfig to JSON string for storage
    scraper_in_data = scraper_in.model_dump(exclude_unset=True)
    scraper_in_data["selectors_json"] = json.dumps([s.model_dump() for s in scraper_in.selectors])
    del scraper_in_data["selectors"] # Remove the Pydantic object list

    scraper = crud.scraper_config.create(db, ScraperConfigCreate(**scraper_in_data), owner_id=current_user.id)
    
    # Add/Update job in scheduler if a cron schedule is provided
    scheduler.add_or_update_scheduler_job(db, scraper)
    
    logger.info(f"User {current_user.username} created scraper '{scraper.name}' (ID: {scraper.id}).")
    return ScraperConfigInDB.model_validate(scraper, update={'owner_username': current_user.username})

@router.get("/", response_model=PaginatedResponse[ScraperConfigInDB], summary="Get all scraper configs (or by user)")
async def read_scrapers(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    is_admin: bool = Depends(get_current_active_admin_user) # To check if the user is an admin without raising exception
):
    """
    Retrieve all scraper configurations. Admins can see all, regular users see only their own.
    """
    filters = {}
    if not is_admin: # If not an admin, filter by owner_id
        filters["owner_id"] = current_user.id

    scrapers, total = crud.scraper_config.get_multi_with_count(db, skip=skip, limit=limit, **filters)
    
    # Enrich with owner_username for display
    scraper_in_db_list = []
    for s in scrapers:
        owner_username = db.query(User.username).filter(User.id == s.owner_id).scalar()
        scraper_in_db_list.append(ScraperConfigInDB.model_validate(s, update={'owner_username': owner_username}))

    logger.info(f"User {current_user.username} retrieved {len(scrapers)} scraper configs.")
    return PaginatedResponse(total=total, page=skip // limit + 1, page_size=limit, items=scraper_in_db_list)

@router.get("/{scraper_id}", response_model=ScraperConfigInDB, summary="Get scraper config by ID")
async def read_scraper(
    scraper_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    is_admin: bool = Depends(get_current_active_admin_user)
):
    """
    Retrieve a specific scraper configuration by ID.
    Users can only access their own scrapers, unless they are an admin.
    """
    scraper = crud.scraper_config.get(db, scraper_id)
    if not scraper:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scraper not found")
    if not is_admin and scraper.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this scraper")

    owner_username = db.query(User.username).filter(User.id == scraper.owner_id).scalar()
    logger.info(f"User {current_user.username} retrieved scraper '{scraper.name}' (ID: {scraper.id}).")
    return ScraperConfigInDB.model_validate(scraper, update={'owner_username': owner_username})

@router.put("/{scraper_id}", response_model=ScraperConfigInDB, summary="Update a scraper config")
async def update_scraper(
    scraper_id: int,
    scraper_in: ScraperConfigUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    is_admin: bool = Depends(get_current_active_admin_user)
):
    """
    Update an existing scraper configuration by ID.
    Users can only update their own scrapers, unless they are an admin.
    """
    scraper = crud.scraper_config.get(db, scraper_id)
    if not scraper:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scraper not found")
    if not is_admin and scraper.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update this scraper")

    # Convert list of SelectorConfig to JSON string for storage if provided
    update_data = scraper_in.model_dump(exclude_unset=True)
    if "selectors" in update_data and update_data["selectors"] is not None:
        update_data["selectors_json"] = json.dumps([s.model_dump() for s in update_data["selectors"]])
        del update_data["selectors"]
    
    # Create a temporary ScraperConfigUpdate object for crud.update
    temp_scraper_update = ScraperConfigUpdate(**update_data)
    updated_scraper = crud.scraper_config.update(db, scraper, temp_scraper_update)
    
    # Update job in scheduler if cron schedule changed or active status changed
    scheduler.add_or_update_scheduler_job(db, updated_scraper)

    owner_username = db.query(User.username).filter(User.id == updated_scraper.owner_id).scalar()
    logger.info(f"User {current_user.username} updated scraper '{updated_scraper.name}' (ID: {updated_scraper.id}).")
    return ScraperConfigInDB.model_validate(updated_scraper, update={'owner_username': owner_username})

@router.delete("/{scraper_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a scraper config")
async def delete_scraper(
    scraper_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    is_admin: bool = Depends(get_current_active_admin_user)
):
    """
    Delete a scraper configuration by ID.
    Users can only delete their own scrapers, unless they are an admin.
    Associated scraping tasks and results will also be deleted due to cascade.
    """
    scraper = crud.scraper_config.get(db, scraper_id)
    if not scraper:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scraper not found")
    if not is_admin and scraper.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this scraper")

    crud.scraper_config.remove(db, scraper_id)
    # Remove job from scheduler
    job_id = f"scraper_{scraper_id}"
    if scheduler.scheduler.get_job(job_id):
        scheduler.scheduler.remove_job(job_id)
        logger.info(f"Removed scheduler job for scraper ID {scraper_id}")

    logger.info(f"User {current_user.username} deleted scraper '{scraper.name}' (ID: {scraper.id}).")
    return

@router.post("/{scraper_id}/run", response_model=ScrapingTaskInDB, summary="Manually trigger a scraper to run")
async def run_scraper_manually(
    scraper_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    is_admin: bool = Depends(get_current_active_admin_user)
):
    """
    Manually trigger a scraping task for a given scraper configuration.
    Users can only trigger their own scrapers, unless they are an admin.
    The scraping process runs in the background.
    """
    scraper = crud.scraper_config.get(db, scraper_id)
    if not scraper:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scraper not found")
    if not is_admin and scraper.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to run this scraper")
    if not scraper.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Scraper is not active and cannot be run.")

    new_task = ScrapingTask(
        scraper_config_id=scraper_id,
        owner_id=current_user.id,
        status=TaskStatus.PENDING,
        log=f"Manual task triggered by {current_user.username} at {datetime.utcnow().isoformat()}"
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)

    # Run the scraping in the background
    asyncio.create_task(scrape_website(new_task.id))
    
    logger.info(f"User {current_user.username} manually triggered scraper '{scraper.name}' (ID: {scraper.id}). New task ID: {new_task.id}")
    return ScrapingTaskInDB.model_validate(new_task, update={'owner_username': current_user.username})
```