```python
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.cache import cached
from app.core.dependencies import get_db, get_current_active_user, get_current_active_superuser
from app.crud.product import crud_product
from app.schemas.product import ProductCreate, ProductPublic, ProductUpdate
from app.core.logging_config import setup_logging

router = APIRouter()
logger = setup_logging(__name__)

@router.get("/", response_model=List[ProductPublic])
@cached(key="all_products", ttl=60) # Cache all products for 60 seconds
def read_products(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = Query(None, description="Search by product name"),
    category_id: Optional[int] = Query(None, description="Filter by category ID"),
):
    """
    Retrieve products. Can be filtered by search term or category.
    """
    products = crud_product.get_multi_filtered(
        db, skip=skip, limit=limit, search=search, category_id=category_id
    )
    logger.info(f"Retrieved {len(products)} products with skip={skip}, limit={limit}, search='{search}', category_id={category_id}")
    return products


@router.post("/", response_model=ProductPublic, status_code=status.HTTP_201_CREATED)
def create_product(
    *,
    db: Session = Depends(get_db),
    product_in: ProductCreate,
    current_user: UserPublic = Depends(get_current_active_superuser), # Only superuser can create
):
    """
    Create a new product. Accessible only by superusers.
    """
    product = crud_product.create_with_owner(db, obj_in=product_in, owner_id=current_user.id)
    logger.info(f"Product '{product.name}' created by superuser {current_user.email}.")
    return product


@router.get("/{product_id}", response_model=ProductPublic)
@cached(key_prefix="product", ttl=300) # Cache individual product for 300 seconds
def read_product_by_id(
    product_id: int,
    db: Session = Depends(get_db),
):
    """
    Get a specific product by ID.
    """
    product = crud_product.get(db, id=product_id)
    if not product:
        logger.warning(f"Product with ID {product_id} not found.")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Product not found"
        )
    logger.info(f"Retrieved product with ID {product_id}: '{product.name}'.")
    return product


@router.put("/{product_id}", response_model=ProductPublic)
def update_product(
    *,
    db: Session = Depends(get_db),
    product_id: int,
    product_in: ProductUpdate,
    current_user: UserPublic = Depends(get_current_active_superuser), # Only superuser can update
):
    """
    Update a product. Accessible only by superusers.
    """
    product = crud_product.get(db, id=product_id)
    if not product:
        logger.warning(f"Attempted to update non-existent product with ID {product_id} by superuser {current_user.email}.")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Product not found"
        )
    # Optional: Check if current_user is the owner of the product or a superuser if ownership is important
    # if not crud_product.is_owner(current_user, product):
    #     raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update this product")

    product = crud_product.update(db, db_obj=product, obj_in=product_in)
    logger.info(f"Product with ID {product_id} updated by superuser {current_user.email}.")
    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    *,
    db: Session = Depends(get_db),
    product_id: int,
    current_user: UserPublic = Depends(get_current_active_superuser), # Only superuser can delete
):
    """
    Delete a product. Accessible only by superusers.
    """
    product = crud_product.get(db, id=product_id)
    if not product:
        logger.warning(f"Attempted to delete non-existent product with ID {product_id} by superuser {current_user.email}.")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    crud_product.remove(db, id=product_id)
    logger.info(f"Product with ID {product_id} deleted by superuser {current_user.email}.")
    return {"message": "Product deleted successfully"}

```