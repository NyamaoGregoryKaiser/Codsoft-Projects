from typing import List, Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.crud_item import item as crud_item
from app.schemas.item import Item as ItemSchema, ItemCreate, ItemUpdate
from app.dependencies import get_db, get_current_active_verified_user
from app.models.user import User as UserModel
from app.core.exceptions import NotFoundException
from app.core.logging_config import setup_logging

logger = setup_logging(__name__)

router = APIRouter()

@router.post("/", response_model=ItemSchema, status_code=status.HTTP_201_CREATED)
async def create_item_for_current_user(
    *,
    db: Annotated[AsyncSession, Depends(get_db)],
    item_in: ItemCreate,
    current_user: Annotated[UserModel, Depends(get_current_active_verified_user)],
):
    """
    Create a new item for the current user. Requires email verification.
    """
    item = await crud_item.create_with_owner(db, obj_in=item_in, owner_id=current_user.id)
    logger.info(f"User {current_user.id} created item {item.id}.")
    return item


@router.get("/", response_model=List[ItemSchema])
async def read_current_user_items(
    db: Annotated[AsyncSession, Depends(get_db)],
    skip: int = 0,
    limit: int = 100,
    current_user: Annotated[UserModel, Depends(get_current_active_verified_user)],
):
    """
    Retrieve items belonging to the current user. Requires email verification.
    """
    items = await crud_item.get_multi_by_owner(db, owner_id=current_user.id, skip=skip, limit=limit)
    return items


@router.get("/{item_id}", response_model=ItemSchema)
async def read_item_by_id(
    item_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[UserModel, Depends(get_current_active_verified_user)],
):
    """
    Get a specific item by ID (must be owned by current user). Requires email verification.
    """
    item = await crud_item.get(db, id=item_id)
    if not item:
        raise NotFoundException(detail="Item not found.")
    if item.owner_id != current_user.id:
        raise NotFoundException(detail="Item not found.") # Or Forbidden if you want to distinguish
    return item


@router.put("/{item_id}", response_model=ItemSchema)
async def update_item(
    *,
    db: Annotated[AsyncSession, Depends(get_db)],
    item_id: int,
    item_in: ItemUpdate,
    current_user: Annotated[UserModel, Depends(get_current_active_verified_user)],
):
    """
    Update a specific item (must be owned by current user). Requires email verification.
    """
    item = await crud_item.get(db, id=item_id)
    if not item:
        raise NotFoundException(detail="Item not found.")
    if item.owner_id != current_user.id:
        raise NotFoundException(detail="Item not found.")

    item = await crud_item.update(db, db_obj=item, obj_in=item_in)
    logger.info(f"User {current_user.id} updated item {item.id}.")
    return item


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(
    item_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[UserModel, Depends(get_current_active_verified_user)],
):
    """
    Delete a specific item (must be owned by current user). Requires email verification.
    """
    item = await crud_item.get(db, id=item_id)
    if not item:
        raise NotFoundException(detail="Item not found.")
    if item.owner_id != current_user.id:
        raise NotFoundException(detail="Item not found.")
    
    await crud_item.remove(db, id=item_id)
    logger.info(f"User {current_user.id} deleted item {item.id}.")
    return {"message": "Item deleted successfully."}
```