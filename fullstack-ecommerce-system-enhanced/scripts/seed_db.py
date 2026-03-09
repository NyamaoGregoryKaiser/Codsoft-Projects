```python
import asyncio
import os
import sys
from decimal import Decimal

from faker import Faker
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

# Add the app directory to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../')))

from app.core.config import settings
from app.database import Base
from app.models.user import User
from app.models.product import Category, Product
from app.models.order import Order, OrderItem, CartItem
from app.core.security import get_password_hash

# Initialize Faker
fake = Faker()

async def get_db_session():
    """Returns an asynchronous session."""
    engine = create_async_engine(settings.DATABASE_URL, echo=False, future=True)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    return async_session

async def create_tables(engine):
    """Create all tables."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

async def check_for_existing_data(db: AsyncSession):
    """Check if tables already contain data."""
    user_count = await db.scalar(sa.select(sa.func.count(User.id)))
    product_count = await db.scalar(sa.select(sa.func.count(Product.id)))
    if user_count > 0 or product_count > 0:
        return True
    return False

async def seed_data():
    engine = create_async_engine(settings.DATABASE_URL, echo=False, future=True)
    async_session_factory = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    print("Attempting to connect to database and seed data...")
    async with async_session_factory() as db:
        # Check if tables are empty before seeding
        import sqlalchemy as sa # Import here to avoid circular dependency with models if Base is imported higher
        if await check_for_existing_data(db):
            print("Database already contains data. Skipping seeding.")
            await engine.dispose()
            return

        print("Database is empty or does not exist. Seeding initial data...")

        # Create Admin User
        admin_user = User(
            email=settings.ADMIN_EMAIL,
            hashed_password=get_password_hash(settings.ADMIN_PASSWORD),
            first_name="Admin",
            last_name="User",
            is_active=True,
            is_admin=True,
        )
        db.add(admin_user)
        await db.flush() # Ensure admin_user gets an ID

        # Create Regular Users
        users = []
        for _ in range(5):
            user = User(
                email=fake.email(),
                hashed_password=get_password_hash("password"),
                first_name=fake.first_name(),
                last_name=fake.last_name(),
                is_active=True,
                is_admin=False,
            )
            users.append(user)
            db.add(user)
        await db.flush() # Ensure users get IDs

        # Create Categories
        categories_data = ["Electronics", "Books", "Clothing", "Home & Kitchen", "Sports"]
        categories = []
        for cat_name in categories_data:
            category = Category(name=cat_name, description=fake.sentence())
            categories.append(category)
            db.add(category)
        await db.flush() # Ensure categories get IDs

        # Create Products
        products = []
        for _ in range(30):
            category = fake.random_element(elements=categories)
            product = Product(
                name=fake.ecommerce_name(),
                description=fake.paragraph(),
                price=Decimal(fake.random_int(min=10, max=1000) + fake.random_digit() / 100),
                stock_quantity=fake.random_int(min=0, max=200),
                category_id=category.id,
                image_url=fake.image_url(),
                is_available=fake.boolean(chance_of_getting_true=90)
            )
            products.append(product)
            db.add(product)
        await db.flush() # Ensure products get IDs

        # Create Cart Items for some users
        for user in users[:3]: # Add cart items for first 3 users
            num_cart_items = fake.random_int(min=1, max=5)
            selected_products = fake.random_elements(elements=products, length=num_cart_items, unique=True)
            for product in selected_products:
                if product.stock_quantity > 0:
                    quantity = fake.random_int(min=1, max=min(3, product.stock_quantity))
                    cart_item = CartItem(
                        user_id=user.id,
                        product_id=product.id,
                        quantity=quantity
                    )
                    db.add(cart_item)
        await db.flush()

        # Create Orders for some users
        for user in users[2:]: # Create orders for last 3 users
            num_orders = fake.random_int(min=1, max=3)
            for _ in range(num_orders):
                num_order_items = fake.random_int(min=1, max=5)
                selected_products = fake.random_elements(elements=products, length=num_order_items, unique=True)
                
                if not selected_products:
                    continue # Skip if no products selected

                total_amount = Decimal('0.00')
                order_items_data = []

                for product in selected_products:
                    if product.stock_quantity > 0:
                        quantity = fake.random_int(min=1, max=min(3, product.stock_quantity))
                        item_price = product.price
                        total_amount += item_price * quantity
                        order_items_data.append({
                            "product_id": product.id,
                            "quantity": quantity,
                            "price_at_purchase": item_price
                        })

                if not order_items_data:
                    continue # Skip if no valid order items generated

                order = Order(
                    user_id=user.id,
                    status=fake.random_element(elements=["pending", "processing", "shipped", "delivered", "cancelled"]),
                    total_amount=total_amount,
                    shipping_address=fake.address(),
                    payment_status=fake.random_element(elements=["pending", "paid", "refunded"])
                )
                db.add(order)
                await db.flush() # Flush to get order ID

                for item_data in order_items_data:
                    order_item = OrderItem(order_id=order.id, **item_data)
                    db.add(order_item)

        await db.commit()
        print("Data seeding completed successfully.")

    await engine.dispose() # Close the database connection pool

if __name__ == "__main__":
    asyncio.run(seed_data())

```