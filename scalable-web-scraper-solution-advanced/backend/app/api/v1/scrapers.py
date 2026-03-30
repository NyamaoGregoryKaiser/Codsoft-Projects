from typing import Any, List, Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from redis.asyncio import Redis
from fastapi_limiter.depends import RateLimiter
from async_lru import alru_cache

from app import crud, models, schemas
from app.api import deps
from app.tasks.scraping_tasks import scrape_task

router = APIRouter()

@alru_cache(maxsize=128)
async def get_scraper_from_cache(db: Session, scraper_id: int) -> models.Scraper | None:
    # This function is not truly cache-aware from a global perspective, but it shows the concept.
    # For a shared cache, a proper Redis cache would be used.
    # The alru_cache is more for repetitive calls within the same process.
    return crud.scraper.get(db, id=scraper_id)

@router.get("/", response_model=List[schemas.Scraper])
async def read_scrapers(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """
    Retrieve scrapers. Only superusers can see all, regular users see their own.
    """
    if crud.user.is_superuser(current_user):
        scrapers = crud.scraper.get_multi(db, skip=skip, limit=limit)
    else:
        scrapers = crud.scraper.get_multi_by_owner(db, owner_id=current_user.id, skip=skip, limit=limit)
    return scrapers

@router.post("/", response_model=schemas.Scraper)
async def create_scraper(
    *,
    db: Session = Depends(deps.get_db),
    scraper_in: schemas.ScraperCreate,
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """
    Create new scraper.
    """
    scraper = crud.scraper.create_with_owner(db, obj_in=scraper_in, owner_id=current_user.id)
    # Invalidate cache for scraper list for this user/all users if admin
    await get_scraper_from_cache.cache_clear()
    return scraper

@router.get("/{scraper_id}", response_model=schemas.Scraper)
async def read_scraper(
    scraper_id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """
    Get a specific scraper by ID.
    """
    # Try fetching from cache first (demonstration of local cache)
    scraper = await get_scraper_from_cache(db, scraper_id)
    
    if not scraper:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Scraper not found"
        )
    if not crud.user.is_superuser(current_user) and scraper.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions"
        )
    return scraper

@router.put("/{scraper_id}", response_model=schemas.Scraper)
async def update_scraper(
    *,
    db: Session = Depends(deps.get_db),
    scraper_id: int,
    scraper_in: schemas.ScraperUpdate,
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """
    Update a scraper.
    """
    scraper = crud.scraper.get(db, id=scraper_id)
    if not scraper:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The scraper with this ID does not exist in the system",
        )
    if not crud.user.is_superuser(current_user) and scraper.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions"
        )
    scraper = crud.scraper.update(db, db_obj=scraper, obj_in=scraper_in)
    await get_scraper_from_cache.cache_clear() # Invalidate cache
    return scraper

@router.delete("/{scraper_id}", response_model=schemas.Scraper)
async def delete_scraper(
    *,
    db: Session = Depends(deps.get_db),
    scraper_id: int,
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """
    Delete a scraper.
    """
    scraper = crud.scraper.get(db, id=scraper_id)
    if not scraper:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The scraper with this ID does not exist in the system",
        )
    if not crud.user.is_superuser(current_user) and scraper.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions"
        )
    crud.scraper.remove(db, id=scraper_id)
    await get_scraper_from_cache.cache_clear() # Invalidate cache
    return scraper

@router.post("/{scraper_id}/run", response_model=schemas.ScrapingJob)
async def run_scraper_now(
    scraper_id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
    # Apply rate limiting to this endpoint
    _: Annotated[Redis, Depends(RateLimiter(times=5, seconds=60))] = Depends(deps.get_redis_client)
) -> Any:
    """
    Trigger an immediate run of a scraper. Rate-limited to 5 runs per minute per user.
    """
    scraper = crud.scraper.get(db, id=scraper_id)
    if not scraper:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Scraper not found"
        )
    if not crud.user.is_superuser(current_user) and scraper.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions to run this scraper"
        )
    
    # Create a new job entry
    job_in = schemas.ScrapingJobCreate(scraper_id=scraper_id)
    job = crud.job.create_with_owner(db, obj_in=job_in, owner_id=current_user.id)

    # Send task to Celery
    scrape_task.delay(job.id, scraper_id, current_user.id)
    
    return job