from typing import List

from fastapi import APIRouter, Depends, status
from fastapi_cache.decorator import cache
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.core.config import settings
from app.core.database import get_db
from app.core.exceptions import ForbiddenException, NotFoundException
from app.crud.scraper import scraper as crud_scraper
from app.models.user import User as DBUser
from app.schemas.scraper import Scraper, ScraperCreate, ScraperUpdate
from app.services.scraper_service import ScraperService

router = APIRouter()

@router.get("/", response_model=List[Scraper])
@cache(expire=60) # Cache scraper list for 60 seconds
async def read_scrapers(
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: DBUser = Depends(deps.get_current_user),
) -> List[Scraper]:
    """
    Retrieve scrapers belonging to the current user. Superusers can see all.
    """
    if current_user.is_superuser:
        scrapers = await crud_scraper.get_multi(db, skip=skip, limit=limit)
    else:
        scrapers = await crud_scraper.get_multi(db, owner_id=current_user.id, skip=skip, limit=limit)
    return scrapers

@router.post("/", response_model=Scraper, status_code=status.HTTP_201_CREATED)
async def create_scraper(
    *,
    db: AsyncSession = Depends(get_db),
    scraper_in: ScraperCreate,
    current_user: DBUser = Depends(deps.get_current_user),
    scraper_service: ScraperService = Depends(), # Inject the service
) -> Scraper:
    """
    Create a new scraper.
    """
    scraper = await scraper_service.create_scraper(scraper_in, current_user.id)
    return scraper

@router.get("/{scraper_id}", response_model=Scraper)
@cache(expire=30) # Cache individual scraper for 30 seconds
async def read_scraper_by_id(
    scraper_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: DBUser = Depends(deps.get_current_user),
) -> Scraper:
    """
    Get a specific scraper by ID.
    """
    scraper = await crud_scraper.get(db, id=scraper_id)
    if not scraper:
        raise NotFoundException(detail="Scraper not found")
    if not current_user.is_superuser and scraper.owner_id != current_user.id:
        raise ForbiddenException(detail="Not authorized to access this scraper")
    return scraper

@router.put("/{scraper_id}", response_model=Scraper)
async def update_scraper(
    scraper_id: int,
    scraper_in: ScraperUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: DBUser = Depends(deps.get_current_user),
    scraper_service: ScraperService = Depends(),
) -> Scraper:
    """
    Update a scraper.
    """
    scraper = await crud_scraper.get(db, id=scraper_id)
    if not scraper:
        raise NotFoundException(detail="Scraper not found")
    if not current_user.is_superuser and scraper.owner_id != current_user.id:
        raise ForbiddenException(detail="Not authorized to update this scraper")
    
    # Basic validation for parse rules on update as well
    if scraper_in.parse_rules and not isinstance(scraper_in.parse_rules, dict):
        raise UnprocessableEntityException(detail="Parse rules must be a JSON object.")

    scraper = await crud_scraper.update(db, db_obj=scraper, obj_in=scraper_in)
    return scraper

@router.delete("/{scraper_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_scraper(
    scraper_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: DBUser = Depends(deps.get_current_user),
):
    """
    Delete a scraper.
    """
    scraper = await crud_scraper.get(db, id=scraper_id)
    if not scraper:
        raise NotFoundException(detail="Scraper not found")
    if not current_user.is_superuser and scraper.owner_id != current_user.id:
        raise ForbiddenException(detail="Not authorized to delete this scraper")

    await crud_scraper.remove(db, id=scraper_id)
    return {"message": "Scraper deleted successfully"}

```
---