```python
from typing import Annotated, List, Optional
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session

from app.api.v1.endpoints import deps
from app.crud.item import crud_item
from app.schemas.item import ItemCreate, ItemUpdate, ItemInDB
from app.schemas.msg import Msg
from app.schemas.user import UserInDB
from app.core.exceptions import NotFoundException, ForbiddenException
from app.core.logging import logger

router = APIRouter()

@router.get("/", response_model=List[ItemInDB], summary="Retrieve user's items")
async def read_items(
    db: Annotated[Session, Depends(deps.get_db)],
    current_user: Annotated[UserInDB, Depends(deps.get_current_active_user)],
    skip: int = 0,
    limit: int = 100,
):
    """
    Retrieve items belonging to the current authenticated user.
    Admins can also view all items if a specific owner_id is not provided.
    """
    logger.info("User retrieving items", user_id=current_user.id)
    if current_user.role == "admin":
        items = crud_item.get_multi(db, skip=skip, limit=limit) # Admin can see all items
    else:
        items = crud_item.get_multi_by_owner(db, owner_id=current_user.id, skip=skip, limit=limit)
    return items

@router.post("/", response_model=ItemInDB, status_code=status.HTTP_201_CREATED, summary="Create a new item")
async def create_item(
    item_in: ItemCreate,
    db: Annotated[Session, Depends(deps.get_db)],
    current_user: Annotated[UserInDB, Depends(deps.get_current_active_user)],
):
    """
    Create a new item associated with the current authenticated user.
    """
    item = crud_item.create_with_owner(db, obj_in=item_in, owner_id=current_user.id)
    logger.info("Item created by user", user_id=current_user.id, item_id=item.id, title=item.title)
    return item

@router.get("/{item_id}", response_model=ItemInDB, summary="Retrieve a specific item")
async def read_item_by_id(
    item_id: int,
    db: Annotated[Session, Depends(deps.get_db)],
    current_user: Annotated[UserInDB, Depends(deps.get_current_active_user)],
):
    """
    Retrieve a specific item by ID.
    Only the owner or an admin can access it.
    """
    item = crud_item.get_by_id(db, id=item_id)
    if not item:
        logger.warning("Attempt to access non-existent item", user_id=current_user.id, item_id=item_id)
        raise NotFoundException(detail="Item not found")
    
    if item.owner_id != current_user.id and current_user.role != "admin":
        logger.warning("Unauthorized access attempt to item", user_id=current_user.id, item_id=item_id, owner_id=item.owner_id)
        raise ForbiddenException(detail="Not authorized to access this item")
    
    logger.info("Item accessed by user", user_id=current_user.id, item_id=item.id, owner_id=item.owner_id)
    return item

@router.put("/{item_id}", response_model=ItemInDB, summary="Update a specific item")
async def update_item(
    item_id: int,
    item_in: ItemUpdate,
    db: Annotated[Session, Depends(deps.get_db)],
    current_user: Annotated[UserInDB, Depends(deps.get_current_active_user)],
):
    """
    Update a specific item by ID.
    Only the owner or an admin can update it.
    """
    item = crud_item.get_by_id(db, id=item_id)
    if not item:
        logger.warning("Attempt to update non-existent item", user_id=current_user.id, item_id=item_id)
        raise NotFoundException(detail="Item not found")
    
    if item.owner_id != current_user.id and current_user.role != "admin":
        logger.warning("Unauthorized update attempt to item", user_id=current_user.id, item_id=item_id, owner_id=item.owner_id)
        raise ForbiddenException(detail="Not authorized to update this item")
    
    updated_item = crud_item.update(db, db_obj=item, obj_in=item_in)
    logger.info("Item updated by user", user_id=current_user.id, item_id=item.id, owner_id=item.owner_id,
                updated_fields=item_in.dict(exclude_unset=True))
    return updated_item

@router.delete("/{item_id}", response_model=Msg, summary="Delete a specific item")
async def delete_item(
    item_id: int,
    db: Annotated[Session, Depends(deps.get_db)],
    current_user: Annotated[UserInDB, Depends(deps.get_current_active_user)],
):
    """
    Delete a specific item by ID.
    Only the owner or an admin can delete it.
    """
    item = crud_item.get_by_id(db, id=item_id)
    if not item:
        logger.warning("Attempt to delete non-existent item", user_id=current_user.id, item_id=item_id)
        raise NotFoundException(detail="Item not found")
    
    if item.owner_id != current_user.id and current_user.role != "admin":
        logger.warning("Unauthorized delete attempt to item", user_id=current_user.id, item_id=item_id, owner_id=item.owner_id)
        raise ForbiddenException(detail="Not authorized to delete this item")
    
    crud_item.remove(db, id=item_id)
    logger.info("Item deleted by user", user_id=current_user.id, item_id=item.id, owner_id=item.owner_id)
    return Msg(message="Item deleted successfully")
```