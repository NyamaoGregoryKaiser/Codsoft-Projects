```python
import logging
from typing import List, Annotated, Optional
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.product import ProductPublic, ProductCreate, ProductUpdate, CategoryPublic, CategoryCreate, CategoryUpdate
from app.crud.crud_product import (
    get_product, get_products, create_product, update_product, delete_product,
    get_category, get_categories, create_category, update_category, delete_category
)
from app.utils.dependencies import get_current_admin_user, get_current_user_optional
from app.utils.decorators import cached_result

logger = logging.getLogger("ecommerce_system")

router = APIRouter()

# === Category Endpoints ===

@router.post("/categories", response_model=CategoryPublic, status_code=status.HTTP_201_CREATED)
async def create_new_category(
    category_in: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    current_admin: Annotated[None, Depends(get_current_admin_user)] = None # Requires admin
):
    """
    Admin: Creates a new product category.
    """
    category = await create_category(db, category_in)
    logger.info(f"Admin {current_admin.email} created new category: {category.name}")
    return category

@router.get("/categories", response_model=List[CategoryPublic])
@cached_result(key_prefix="all_categories", ttl=300) # Cache for 5 minutes
async def read_categories(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieves a list of all product categories.
    Available to all users (no authentication required).
    """
    categories = await get_categories(db, skip=skip, limit=limit)
    logger.debug(f"Retrieved {len(categories)} categories.")
    return categories

@router.get("/categories/{category_id}", response_model=CategoryPublic)
@cached_result(key_prefix="category_by_id", ttl=300)
async def read_category_by_id(
    category_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieves a specific product category by ID.
    Available to all users.
    """
    category = await get_category(db, category_id)
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    logger.debug(f"Retrieved category ID: {category_id}")
    return category

@router.put("/categories/{category_id}", response_model=CategoryPublic)
async def update_existing_category(
    category_id: int,
    category_in: CategoryUpdate,
    db: AsyncSession = Depends(get_db),
    current_admin: Annotated[None, Depends(get_current_admin_user)] = None # Requires admin
):
    """
    Admin: Updates an existing product category.
    """
    category = await get_category(db, category_id)
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    
    updated_category = await update_category(db, category, category_in)
    logger.info(f"Admin {current_admin.email} updated category ID {category_id}.")
    return updated_category

@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_existing_category(
    category_id: int,
    db: AsyncSession = Depends(get_db),
    current_admin: Annotated[None, Depends(get_current_admin_user)] = None # Requires admin
):
    """
    Admin: Deletes a product category.
    Note: Deleting a category might set `category_id` to NULL for associated products or prevent deletion if relations are strict.
    """
    category = await get_category(db, category_id)
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    
    await delete_category(db, category_id)
    logger.info(f"Admin {current_admin.email} deleted category ID {category_id}.")
    return None

# === Product Endpoints ===

@router.post("/", response_model=ProductPublic, status_code=status.HTTP_201_CREATED)
async def create_new_product(
    product_in: ProductCreate,
    db: AsyncSession = Depends(get_db),
    current_admin: Annotated[None, Depends(get_current_admin_user)] = None # Requires admin
):
    """
    Admin: Creates a new product.
    """
    # Optional: Check if category_id exists
    if product_in.category_id:
        category = await get_category(db, product_in.category_id)
        if not category:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Category ID not found")
            
    product = await create_product(db, product_in)
    logger.info(f"Admin {current_admin.email} created new product: {product.name}")
    return product

@router.get("/", response_model=List[ProductPublic])
@cached_result(key_prefix="all_products", ttl=60) # Cache for 1 minute
async def read_products(
    search: Optional[str] = Query(None, min_length=1, description="Search term for product name or description"),
    category_id: Optional[int] = Query(None, description="Filter products by category ID"),
    min_price: Optional[Decimal] = Query(None, ge=0, description="Minimum price"),
    max_price: Optional[Decimal] = Query(None, ge=0, description="Maximum price"),
    available_only: bool = Query(True, description="Only show available products"),
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user_optional: Annotated[None, Depends(get_current_user_optional)] = None # Allows logged-in users to potentially see more, but not required
):
    """
    Retrieves a list of all products, with optional filtering and searching.
    Available to all users.
    """
    # Query optimization: Filters are applied directly in the CRUD function.
    # The caching layer intercepts before hitting DB if identical query.
    products = await get_products(
        db, 
        skip=skip, 
        limit=limit, 
        search=search, 
        category_id=category_id, 
        min_price=min_price, 
        max_price=max_price,
        available_only=available_only
    )
    logger.debug(f"Retrieved {len(products)} products with filters.")
    return products

@router.get("/{product_id}", response_model=ProductPublic)
@cached_result(key_prefix="product_by_id", ttl=300)
async def read_product_by_id(
    product_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieves a specific product by ID.
    Available to all users.
    """
    product = await get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    logger.debug(f"Retrieved product ID: {product_id}")
    return product

@router.put("/{product_id}", response_model=ProductPublic)
async def update_existing_product(
    product_id: int,
    product_in: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    current_admin: Annotated[None, Depends(get_current_admin_user)] = None # Requires admin
):
    """
    Admin: Updates an existing product's details.
    """
    product = await get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    # Optional: Check if category_id exists if it's being updated
    if product_in.category_id is not None and product_in.category_id != product.category_id:
        if product_in.category_id: # Allow setting to None (no category)
            category = await get_category(db, product_in.category_id)
            if not category:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Category ID not found")
            
    updated_product = await update_product(db, product, product_in)
    logger.info(f"Admin {current_admin.email} updated product ID {product_id}.")
    return updated_product

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_existing_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    current_admin: Annotated[None, Depends(get_current_admin_user)] = None # Requires admin
):
    """
    Admin: Deletes a product.
    """
    product = await get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    
    await delete_product(db, product_id)
    logger.info(f"Admin {current_admin.email} deleted product ID {product_id}.")
    return None

```