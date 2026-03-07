```python
import pytest
import asyncio
from typing import AsyncGenerator
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.api.main import app
from app.database.connection import get_db, Base, dispose_db
from app.core.config import settings
from app.database.models import User, Merchant
from app.core.security import get_password_hash
from app.core.constants import UserRole
from app.utils.cache import get_redis_client, close_redis_client

# Override database URL for tests
TEST_DATABASE_URL = settings.DATABASE_URL.replace("payment_processor", "payment_processor_test")

# Create a test engine and session
test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestingSessionLocal = async_sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False
)

async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency override for tests to use a clean database session."""
    async with TestingSessionLocal() as session:
        yield session

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="session", autouse=True)
def event_loop():
    """Create an instance of the default event loop for each test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session")
async def setup_db():
    """Set up and tear down the database for the test session."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all) # Clear existing tables
        await conn.run_sync(Base.metadata.create_all) # Create new tables
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await test_engine.dispose()
    await dispose_db() # Also dispose the main app's engine if it was initialized

@pytest.fixture(scope="function")
async def db_session(setup_db: None) -> AsyncGenerator[AsyncSession, None]:
    """Provides a fresh database session for each test function."""
    async with TestingSessionLocal() as session:
        yield session
        # Clean up data after each test
        for table in reversed(Base.metadata.sorted_tables):
            await session.execute(table.delete())
        await session.commit()

@pytest.fixture(scope="session")
async def test_client() -> AsyncGenerator[AsyncClient, None]:
    """AsyncClient for making requests to the FastAPI app."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client

@pytest.fixture(scope="session")
async def init_redis():
    """Initialize and close redis for the test session."""
    client = await get_redis_client()
    await client.flushdb() # Clear existing data
    yield
    await client.flushdb()
    await close_redis_client()

@pytest.fixture(scope="function")
async def clear_redis(init_redis: None):
    """Clear redis before each test function."""
    client = await get_redis_client()
    await client.flushdb()
    yield

@pytest.fixture
async def admin_user(db_session: AsyncSession) -> User:
    """Creates an admin user for testing."""
    admin = User(
        email="test_admin@example.com",
        hashed_password=get_password_hash("testpassword"),
        role=UserRole.ADMIN
    )
    db_session.add(admin)
    await db_session.commit()
    await db_session.refresh(admin)
    return admin

@pytest.fixture
async def merchant_user(db_session: AsyncSession) -> tuple[User, Merchant]:
    """Creates a merchant user and a merchant for testing."""
    user = User(
        email="test_merchant@example.com",
        hashed_password=get_password_hash("merchantpassword"),
        role=UserRole.MERCHANT
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    merchant = Merchant(
        user_id=user.id,
        name="Test Merchant Inc."
    )
    db_session.add(merchant)
    await db_session.commit()
    await db_session.refresh(merchant)
    return user, merchant
```