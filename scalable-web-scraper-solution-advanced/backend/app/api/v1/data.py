from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.api import deps

router = APIRouter()

@router.get("/", response_model=List[schemas.ScrapedItem])
async def read_scraped_items(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    scraper_id: Optional[int] = None,
    job_id: Optional[int] = None,
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """
    Retrieve scraped items. Superusers can see all, regular users see items for their scrapers.
    Can filter by scraper_id or job_id.
    """
    query_filters = []

    if scraper_id:
        # Check if the user has access to this scraper
        scraper = crud.scraper.get(db, id=scraper_id)
        if not scraper or (not crud.user.is_superuser(current_user) and scraper.owner_id != current_user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions to access data for this scraper"
            )
        query_filters.append(models.ScrapedItem.scraper_id == scraper_id)
    else:
        # If no scraper_id is provided, ensure users only see data from their own scrapers
        if not crud.user.is_superuser(current_user):
            user_scrapers = crud.scraper.get_multi_by_owner(db, owner_id=current_user.id)
            if not user_scrapers:
                return [] # User has no scrapers, so no data
            scraper_ids_owned = [s.id for s in user_scrapers]
            query_filters.append(models.ScrapedItem.scraper_id.in_(scraper_ids_owned))

    if job_id:
        # Check if the user has access to this job
        job = crud.job.get(db, id=job_id)
        if not job or (not crud.user.is_superuser(current_user) and job.owner_id != current_user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions to access data for this job"
            )
        query_filters.append(models.ScrapedItem.job_id == job_id)

    db_query = db.query(models.ScrapedItem)
    for f in query_filters:
        db_query = db_query.filter(f)
    
    scraped_items = db_query.offset(skip).limit(limit).all()
    return scraped_items

@router.get("/{item_id}", response_model=schemas.ScrapedItem)
async def read_scraped_item(
    item_id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """
    Get a specific scraped item by ID.
    """
    item = crud.scraped_item.get(db, id=item_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Scraped item not found"
        )
    
    # Verify user access to the scraper associated with this item
    scraper = crud.scraper.get(db, id=item.scraper_id)
    if not scraper or (not crud.user.is_superuser(current_user) and scraper.owner_id != current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions to access this item"
        )
    return item

@router.delete("/{item_id}", response_model=schemas.ScrapedItem)
async def delete_scraped_item(
    *,
    db: Session = Depends(deps.get_db),
    item_id: int,
    current_user: models.User = Depends(deps.get_current_active_superuser), # Only superusers can delete
) -> Any:
    """
    Delete a scraped item (superuser only).
    """
    item = crud.scraped_item.get(db, id=item_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The scraped item with this ID does not exist in the system",
        )
    crud.scraped_item.remove(db, id=item_id)
    return item