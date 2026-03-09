```python
import asyncio
import os
import sys
from typing import AsyncGenerator
from decimal import Decimal

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import sessionmaker

# Add the app directory to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../')))

# Import necessary modules from the app
from app.main import app
from app.database import Base, get_db
from app.core.config import settings
from app.models.user import User
from app.models.product import Category, Product
from app.models.order import Order, OrderItem, CartItem
from app.core.security import get_password_hash

# Override database URL for testing
TEST_DATABASE_URL = "postgresql+asyncpg://user:password@localhost:5432/ecommerce_test_db" # Must match CI/CD or local test setup
settings.DATABASE_URL = TEST_DATABASE_URL
settings.ADMIN_EMAIL = "test_admin@example.com"
settings.ADMIN_PASSWORD = "test_admin_password"
settings.SECRET_KEY = "test_secret_key_for_testing" # Ensure a strong key in prod

# Create a test engine and session factory
test_engine = create_async_engine(settings.DATABASE_URL, echo=False, future=True)
TestAsyncSessionLocal = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)

@pytest.fixture(scope="session", autouse=True)
def event_loop():
    """Create an instance of the default event loop for each test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session")
async def setup_db_for_testing():
    """
    Sets up and tears down the test database for the entire test session.
    """
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest.fixture(scope="function")
async def db_session(setup_db_for_testing) -> AsyncGenerator[AsyncSession, None]:
    """
    Provides a fresh database session for each test function.
    Rolls back transactions after each test.
    """
    async with TestAsyncSessionLocal() as session:
        async with session.begin(): # Start a transaction
            yield session
            await session.rollback() # Rollback after test completes

@pytest.fixture(scope="function")
async def client(db_session: AsyncSession):
    """
    Provides an asynchronous test client for FastAPI.
    Overrides the get_db dependency to use the test database session.
    """
    # Override the get_db dependency
    app.dependency_overrides[get_db] = lambda: db_session
    
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
    
    # Clean up overrides
    app.dependency_overrides = {}


@pytest.fixture(scope="function")
async def seeded_db_session(db_session: AsyncSession):
    """
    Provides a database session pre-populated with basic seed data.
    """
    # Create an admin user
    admin_user = User(
        email=settings.ADMIN_EMAIL,
        hashed_password=get_password_hash(settings.ADMIN_PASSWORD),
        first_name="Test",
        last_name="Admin",
        is_active=True,
        is_admin=True,
    )
    db_session.add(admin_user)
    await db_session.flush() # Ensure admin_user gets an ID

    # Create a regular user
    regular_user = User(
        email="test_user@example.com",
        hashed_password=get_password_hash("test_password"),
        first_name="Test",
        last_name="User",
        is_active=True,
        is_admin=False,
    )
    db_session.add(regular_user)
    await db_session.flush()

    # Create categories
    cat1 = Category(name="Electronics", description="Electronic gadgets")
    cat2 = Category(name="Books", description="Various books")
    db_session.add_all([cat1, cat2])
    await db_session.flush()

    # Create products
    prod1 = Product(name="Laptop", description="Powerful laptop", price=Decimal("1200.00"), stock_quantity=10, category_id=cat1.id)
    prod2 = Product(name="Keyboard", description="Mechanical keyboard", price=Decimal("75.00"), stock_quantity=20, category_id=cat1.id)
    prod3 = Product(name="Novel", description="Bestselling novel", price=Decimal("15.50"), stock_quantity=50, category_id=cat2.id)
    db_session.add_all([prod1, prod2, prod3])
    await db_session.flush()

    # Add items to user's cart
    cart_item1 = CartItem(user_id=regular_user.id, product_id=prod1.id, quantity=1)
    cart_item2 = CartItem(user_id=regular_user.id, product_id=prod3.id, quantity=2)
    db_session.add_all([cart_item1, cart_item2])
    await db_session.flush()

    # Create an order for the regular user
    order = Order(
        user_id=regular_user.id,
        total_amount=Decimal("1200.00") * 1 + Decimal("15.50") * 2, # Total from prod1 and prod3 items
        shipping_address="123 Test St",
        status="pending",
        payment_status="paid"
    )
    db_session.add(order)
    await db_session.flush()

    order_item1 = OrderItem(order_id=order.id, product_id=prod1.id, quantity=1, price_at_purchase=prod1.price)
    order_item2 = OrderItem(order_id=order.id, product_id=prod3.id, quantity=2, price_at_purchase=prod3.price)
    db_session.add_all([order_item1, order_item2])
    await db_session.flush()

    yield db_session


@pytest.fixture(scope="function")
async def admin_token_headers(client: AsyncClient, seeded_db_session: AsyncSession):
    """
    Returns headers with a valid JWT token for the admin user.
    """
    # The admin user is created in seeded_db_session
    response = await client.post(
        "/api/v1/auth/token",
        data={"username": settings.ADMIN_EMAIL, "password": settings.ADMIN_PASSWORD},
    )
    assert response.status_code == 200
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture(scope="function")
async def regular_user_token_headers(client: AsyncClient, seeded_db_session: AsyncSession):
    """
    Returns headers with a valid JWT token for the regular user.
    """
    # The regular user is created in seeded_db_session
    response = await client.post(
        "/api/v1/auth/token",
        data={"username": "test_user@example.com", "password": "test_password"},
    )
    assert response.status_code == 200
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

```