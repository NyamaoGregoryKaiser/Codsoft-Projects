from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.core.database import get_db
from app.core.exceptions import ForbiddenException, NotFoundException
from app.crud.job import job as crud_job
from app.models.user import User as DBUser
from app.schemas.job import Job
from app.services.scraper_service import ScraperService

router = APIRouter()

@router.get("/", response_model=List[Job])
async def read_jobs(
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: DBUser = Depends(deps.get_current_user),
) -> List[Job]:
    """
    Retrieve scraping jobs belonging to the current user. Superusers can see all.
    """
    if current_user.is_superuser:
        jobs = await crud_job.get_multi(db, skip=skip, limit=limit)
    else:
        jobs = await crud_job.get_multi(db, owner_id=current_user.id, skip=skip, limit=limit)
    return jobs

@router.post("/{scraper_id}/trigger", response_model=Job, status_code=status.HTTP_202_ACCEPTED)
async def trigger_job(
    scraper_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: DBUser = Depends(deps.get_current_user),
    scraper_service: ScraperService = Depends(),
) -> Job:
    """
    Trigger a new scraping job for a given scraper.
    """
    job = await scraper_service.trigger_scraping_job(scraper_id, current_user.id)
    return job

@router.get("/{job_id}", response_model=Job)
async def read_job_by_id(
    job_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: DBUser = Depends(deps.get_current_user),
) -> Job:
    """
    Get a specific scraping job by ID.
    """
    job = await crud_job.get(db, id=job_id)
    if not job:
        raise NotFoundException(detail="Scraping job not found")
    if not current_user.is_superuser and job.owner_id != current_user.id:
        raise ForbiddenException(detail="Not authorized to access this job")
    return job

# No PUT or DELETE for jobs in this iteration, status updates are handled by the worker.
# Job deletion would imply cascade deleting results, which might be undesired.
```
---