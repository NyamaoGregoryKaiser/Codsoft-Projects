```python
import logging
from sqlalchemy.orm import Session

from app.crud.user import crud_user
from app.crud.category import crud_category
from app.crud.product import crud_product
from app.core.config import settings
from app.schemas.user import UserCreate
from app.schemas.category import CategoryCreate
from app.schemas.product import ProductCreate
from app.core.logging_config import setup_logging

logger = setup_logging(__name__)

def init_db(db: Session) -> None:
    """
    Initialize database with a superuser, categories, and sample products.
    """
    # Create superuser
    user = crud_user.get_by_email(db, email=settings.FIRST_SUPERUSER_EMAIL)
    if not user:
        user_in = UserCreate(
            email=settings.FIRST_SUPERUSER_EMAIL,
            password=settings.FIRST_SUPERUSER_PASSWORD,
            full_name="Admin User",
            is_superuser=True,
        )
        user = crud_user.create(db, obj_in=user_in)
        logger.info(f"Created superuser: {user.email}")
    else:
        logger.info(f"Superuser already exists: {user.email}")
    
    # Create sample categories
    categories_data = [
        {"name": "Electronics", "description": "Gadgets, devices, and electronic components."},
        {"name": "Books", "description": "Fiction, non-fiction, educational books."},
        {"name": "Apparel", "description": "Clothing, shoes, and accessories."},
        {"name": "Home & Kitchen", "description": "Appliances, decor, cookware."},
    ]
    created_categories = {}
    for cat_data in categories_data:
        category = crud_category.get_by_name(db, name=cat_data["name"])
        if not category:
            category_in = CategoryCreate(**cat_data)
            category = crud_category.create(db, obj_in=category_in)
            logger.info(f"Created category: {category.name}")
        else:
            logger.info(f"Category already exists: {category.name}")
        created_categories[category.name] = category

    # Create sample products
    products_data = [
        {
            "name": "Wireless Headphones",
            "description": "Premium noise-cancelling wireless headphones.",
            "price": 199.99,
            "stock": 50,
            "category_name": "Electronics",
            "image_url": "https://example.com/headphones.jpg"
        },
        {
            "name": "The Great Novel",
            "description": "A captivating story of adventure and discovery.",
            "price": 25.00,
            "stock": 120,
            "category_name": "Books",
            "image_url": "https://example.com/novel.jpg"
        },
        {
            "name": "Designer T-Shirt",
            "description": "Comfortable cotton t-shirt with unique design.",
            "price": 35.50,
            "stock": 200,
            "category_name": "Apparel",
            "image_url": "https://example.com/tshirt.jpg"
        },
        {
            "name": "Smart Coffee Maker",
            "description": "Programmable coffee maker with app control.",
            "price": 89.95,
            "stock": 30,
            "category_name": "Home & Kitchen",
            "image_url": "https://example.com/coffee_maker.jpg"
        },
        {
            "name": "E-Reader",
            "description": "Portable e-ink reader for avid readers.",
            "price": 129.00,
            "stock": 75,
            "category_name": "Electronics",
            "image_url": "https://example.com/ereader.jpg"
        },
    ]

    for prod_data in products_data:
        product = db.query(crud_product.model).filter(crud_product.model.name == prod_data["name"]).first()
        if not product:
            category = created_categories.get(prod_data["category_name"])
            if category:
                product_in = ProductCreate(
                    name=prod_data["name"],
                    description=prod_data["description"],
                    price=prod_data["price"],
                    stock=prod_data["stock"],
                    category_id=category.id,
                    image_url=prod_data["image_url"]
                )
                product = crud_product.create_with_owner(db, obj_in=product_in, owner_id=user.id)
                logger.info(f"Created product: {product.name}")
            else:
                logger.warning(f"Category '{prod_data['category_name']}' not found for product '{prod_data['name']}'. Product not created.")
        else:
            logger.info(f"Product already exists: {product.name}")

```

#### Pydantic Schemas