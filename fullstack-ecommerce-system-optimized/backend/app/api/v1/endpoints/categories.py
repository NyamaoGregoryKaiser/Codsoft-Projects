```python
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.cache import cached
from app.core.dependencies import get_db, get_current_active_superuser
from app.crud.category import crud_category
from app.schemas.category import CategoryCreate, CategoryPublic, CategoryUpdate
from app.schemas.user import UserPublic # for type hint in dependency
from app.core.logging_config import setup_logging

router = APIRouter()
logger = setup_logging(__name__)

@router.get("/", response_model=List[CategoryPublic])
@cached(key="all_categories", ttl=300)
def read_categories(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
):
    """
    Retrieve categories.
    """
    categories = crud_category.get_multi(db, skip=skip, limit=limit)
    logger.info(f"Retrieved {len(categories)} categories.")
    return categories


@router.post("/", response_model=CategoryPublic, status_code=status.HTTP_201_CREATED)
def create_category(
    *,
    db: Session = Depends(get_db),
    category_in: CategoryCreate,
    current_user: UserPublic = Depends(get_current_active_superuser),
):
    """
    Create a new category. Accessible only by superusers.
    """
    category = crud_category.get_by_name(db, name=category_in.name)
    if category:
        logger.warning(f"Attempted to create duplicate category: {category_in.name} by {current_user.email}.")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category with this name already exists.",
        )
    category = crud_category.create(db, obj_in=category_in)
    logger.info(f"Category '{category.name}' created by superuser {current_user.email}.")
    return category


@router.get("/{category_id}", response_model=CategoryPublic)
@cached(key_prefix="category", ttl=300)
def read_category_by_id(
    category_id: int,
    db: Session = Depends(get_db),
):
    """
    Get a specific category by ID.
    """
    category = crud_category.get(db, id=category_id)
    if not category:
        logger.warning(f"Category with ID {category_id} not found.")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Category not found"
        )
    logger.info(f"Retrieved category with ID {category_id}: '{category.name}'.")
    return category


@router.put("/{category_id}", response_model=CategoryPublic)
def update_category(
    *,
    db: Session = Depends(get_db),
    category_id: int,
    category_in: CategoryUpdate,
    current_user: UserPublic = Depends(get_current_active_superuser),
):
    """
    Update a category. Accessible only by superusers.
    """
    category = crud_category.get(db, id=category_id)
    if not category:
        logger.warning(f"Attempted to update non-existent category with ID {category_id} by superuser {current_user.email}.")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Category not found"
        )
    
    # Check for duplicate name if name is being updated
    if category_in.name and category_in.name != category.name:
        existing_category = crud_category.get_by_name(db, name=category_in.name)
        if existing_category and existing_category.id != category_id:
            logger.warning(f"Attempted to update category ID {category_id} to duplicate name '{category_in.name}' by {current_user.email}.")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Category with this name already exists.",
            )

    category = crud_category.update(db, db_obj=category, obj_in=category_in)
    logger.info(f"Category with ID {category_id} updated by superuser {current_user.email}.")
    return category


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    *,
    db: Session = Depends(get_db),
    category_id: int,
    current_user: UserPublic = Depends(get_current_active_superuser),
):
    """
    Delete a category. Accessible only by superusers.
    """
    category = crud_category.get(db, id=category_id)
    if not category:
        logger.warning(f"Attempted to delete non-existent category with ID {category_id} by superuser {current_user.email}.")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    crud_category.remove(db, id=category_id)
    logger.info(f"Category with ID {category_id} deleted by superuser {current_user.email}.")
    return {"message": "Category deleted successfully"}

```