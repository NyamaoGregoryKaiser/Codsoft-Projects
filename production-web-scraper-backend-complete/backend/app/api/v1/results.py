from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.core.database import get_db
from app.core.exceptions import ForbiddenException, NotFoundException
from app.crud.job import job as crud_job
from app.crud.result import scraped_data as crud_scraped_data
from app.models.user import User as DBUser
from app.schemas.result import ScrapedData

router = APIRouter()

@router.get("/jobs/{job_id}/", response_model=List[ScrapedData])
async def read_results_for_job(
    job_id: int,
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: DBUser = Depends(deps.get_current_user),
) -> List[ScrapedData]:
    """
    Retrieve scraped data results for a specific job.
    """
    job = await crud_job.get(db, id=job_id)
    if not job:
        raise NotFoundException(detail="Scraping job not found")
    if not current_user.is_superuser and job.owner_id != current_user.id:
        raise ForbiddenException(detail="Not authorized to access results for this job")

    results = await crud_scraped_data.get_results_by_job(db, job_id=job_id, skip=skip, limit=limit)
    return results

@router.get("/scrapers/{scraper_id}/", response_model=List[ScrapedData])
async def read_results_for_scraper(
    scraper_id: int,
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: DBUser = Depends(deps.get_current_user),
) -> List[ScrapedData]:
    """
    Retrieve all scraped data results for a specific scraper across all its jobs.
    """
    from app.crud.scraper import scraper as crud_scraper # Avoid circular import
    _scraper = await crud_scraper.get(db, id=scraper_id)
    if not _scraper:
        raise NotFoundException(detail="Scraper not found")
    if not current_user.is_superuser and _scraper.owner_id != current_user.id:
        raise ForbiddenException(detail="Not authorized to access results for this scraper")

    results = await crud_scraped_data.get_results_by_scraper(db, scraper_id=scraper_id, skip=skip, limit=limit)
    return results

@router.get("/{result_id}", response_model=ScrapedData)
async def read_result_by_id(
    result_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: DBUser = Depends(deps.get_current_user),
) -> ScrapedData:
    """
    Get a specific scraped data entry by ID.
    """
    result = await crud_scraped_data.get(db, id=result_id)
    if not result:
        raise NotFoundException(detail="Scraped data entry not found")
    
    # Check ownership via the associated job
    job = await crud_job.get(db, id=result.job_id)
    if not job: # This shouldn't happen if data integrity is maintained
        raise NotFoundException(detail="Associated job not found for this result")

    if not current_user.is_superuser and job.owner_id != current_user.id:
        raise ForbiddenException(detail="Not authorized to access this scraped data")
    
    return result

```
---