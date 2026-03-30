from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.api import deps

router = APIRouter()

@router.get("/", response_model=List[schemas.ScrapingJob])
async def read_jobs(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    scraper_id: Optional[int] = None,
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """
    Retrieve scraping jobs. Superusers can see all, regular users see their own.
    Optionally filter by scraper_id.
    """
    if crud.user.is_superuser(current_user):
        if scraper_id:
            jobs = crud.job.get_multi_by_scraper(db, scraper_id=scraper_id, skip=skip, limit=limit)
        else:
            jobs = crud.job.get_multi(db, skip=skip, limit=limit)
    else:
        if scraper_id:
            # Ensure the scraper belongs to the user if a specific scraper is requested
            scraper = crud.scraper.get(db, id=scraper_id)
            if not scraper or scraper.owner_id != current_user.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions to access jobs for this scraper"
                )
            jobs = crud.job.get_multi_by_scraper(db, scraper_id=scraper_id, owner_id=current_user.id, skip=skip, limit=limit)
        else:
            jobs = crud.job.get_multi_by_owner(db, owner_id=current_user.id, skip=skip, limit=limit)
    return jobs

@router.get("/{job_id}", response_model=schemas.ScrapingJob)
async def read_job(
    job_id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """
    Get a specific scraping job by ID.
    """
    job = crud.job.get(db, id=job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Job not found"
        )
    if not crud.user.is_superuser(current_user) and job.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions"
        )
    return job

# Note: Jobs are created implicitly via POST /api/v1/scrapers/{scraper_id}/run
# Update functionality is mostly internal (status updates by worker), but could be exposed for status corrections by admin.
# For simplicity, we won't expose a direct PUT for jobs for regular users.
```

### `backend/app/api/v1/data.py`
```python