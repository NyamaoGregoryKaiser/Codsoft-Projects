```python
import logging
from typing import List, Optional
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.product import Category, Product
from app.schemas.product import ProductCreate, ProductUpdate, CategoryCreate, CategoryUpdate

logger = logging.getLogger("ecommerce_system")

# === CRUD for Category ===

async def get_category(db: AsyncSession, category_id: int) -> Optional[Category]:
    """Retrieve a category by its ID."""
    result = await db.execute(select(Category).filter(Category.id == category_id))
    return result.scalar_one_or_none()

async def get_category_by_name(db: AsyncSession, name: str) -> Optional[Category]:
    """Retrieve a category by its name."""
    result = await db.execute(select(Category).filter(Category.name == name))
    return result.scalar_one_or_none()

async def get_categories(db: AsyncSession, skip: int = 0, limit: int = 100) -> List[Category]:
    """Retrieve multiple categories with pagination."""
    result = await db.execute(select(Category).offset(skip).limit(limit))
    return result.scalars().all()

async def create_category(db: AsyncSession, category_in: CategoryCreate) -> Category:
    """Create a new category."""
    db_category = Category(name=category_in.name, description=category_in.description)
    db.add(db_category)
    await db.commit()
    await db.refresh(db_category)
    logger.info(f"Category created: {db_category.name}")
    return db_category

async def update_category(db: AsyncSession, category: Category, category_in: CategoryUpdate) -> Category:
    """Update an existing category's details."""
    update_data = category_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(category, key, value)
    
    db.add(category)
    await db.commit()
    await db.refresh(category)
    logger.info(f"Category updated: {category.name} (ID: {category.id})")
    return category

async def delete_category(db: AsyncSession, category_id: int) -> None:
    """Delete a category by its ID."""
    category = await get_category(db, category_id)
    if category:
        await db.delete(category)
        await db.commit()
        logger.info(f"Category deleted: ID {category_id}")
    else:
        logger.warning(f"Attempted to delete non-existent category: ID {category_id}")


# === CRUD for Product ===

async def get_product(db: AsyncSession, product_id: int) -> Optional[Product]:
    """Retrieve a product by its ID, eagerly loading its category."""
    result = await db.execute(
        select(Product)
        .options(selectinload(Product.category))
        .filter(Product.id == product_id)
    )
    return result.scalar_one_or_none()

async def get_products(
    db: AsyncSession, 
    skip: int = 0, 
    limit: int = 100,
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    min_price: Optional[Decimal] = None,
    max_price: Optional[Decimal] = None,
    available_only: bool = True
) -> List[Product]:
    """Retrieve multiple products with pagination and filters."""
    query = select(Product).options(selectinload(Product.category))

    if search:
        search_pattern = f"%{search.lower()}%"
        query = query.filter(
            (Product.name.ilike(search_pattern)) | 
            (Product.description.ilike(search_pattern))
        )
    if category_id:
        query = query.filter(Product.category_id == category_id)
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    if max_price is not None:
        query = query.filter(Product.price <= max_price)
    if available_only:
        query = query.filter(Product.is_available == True, Product.stock_quantity > 0)

    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

async def create_product(db: AsyncSession, product_in: ProductCreate) -> Product:
    """Create a new product."""
    db_product = Product(**product_in.model_dump())
    db.add(db_product)
    await db.commit()
    await db.refresh(db_product)
    logger.info(f"Product created: {db_product.name}")
    return db_product

async def update_product(db: AsyncSession, product: Product, product_in: ProductUpdate) -> Product:
    """Update an existing product's details."""
    update_data = product_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(product, key, value)
    
    db.add(product)
    await db.commit()
    await db.refresh(product)
    logger.info(f"Product updated: {product.name} (ID: {product.id})")
    return product

async def delete_product(db: AsyncSession, product_id: int) -> None:
    """Delete a product by its ID."""
    product = await get_product(db, product_id)
    if product:
        await db.delete(product)
        await db.commit()
        logger.info(f"Product deleted: ID {product_id}")
    else:
        logger.warning(f"Attempted to delete non-existent product: ID {product_id}")

```