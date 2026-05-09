import asyncio
from typing import AsyncGenerator
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.core.database import Base, get_db
from app.main import app
from app.models import user, token  # Import models to ensure they are discovered by SQLAlchemy
from app.utils.redis_client import init_redis_client, close_redis_client, get_redis_client
import redis.asyncio as redis

# Override DATABASE_URL for tests to use a separate test database
# IMPORTANT: Ensure your test database is isolated and can be safely dropped.
TEST_DATABASE_URL = settings.DATABASE_URL.replace("/auth_db", "/test_auth_db")
settings.DATABASE_URL = TEST_DATABASE_URL

# Create a test engine and session
test_engine = create_async_engine(TEST_DATABASE_URL, echo=False, future=True)
TestingSessionLocal = async_sessionmaker(autocommit=False, autoflush=False, bind=test_engine, class_=AsyncSession)

@pytest.fixture(scope="session")
def event_loop():
    """
    Creates an instance of the default event loop for the test session.
    """
    policy = asyncio.get_event_loop_policy()
    loop = policy.new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session", autouse=True)
async def setup_test_db():
    """
    Sets up and tears down the test database.
    Creates tables before tests, drops them after.
    """
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Provides a fresh database session for each test function.
    Rolls back transactions after each test.
    """
    async with TestingSessionLocal() as session:
        yield session
        await session.rollback() # Rollback after each test to ensure clean state

@pytest.fixture(scope="session", autouse=True)
async def setup_redis():
    """
    Initializes and closes Redis client for the test session.
    """
    await init_redis_client()
    # Clear Redis before starting tests
    test_redis_client: redis.Redis = await get_redis_client()
    await test_redis_client.flushdb()
    yield
    await close_redis_client()


@pytest.fixture(scope="function", autouse=True)
async def clear_redis_after_each_test():
    """
    Clears Redis data after each test function.
    """
    test_redis_client: redis.Redis = await get_redis_client()
    await test_redis_client.flushdb()
    yield


@pytest.fixture(scope="function")
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """
    Provides an asynchronous test client for FastAPI.
    Overrides the get_db dependency to use the test database session.
    """
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_redis_client] = lambda: get_redis_client() # Use the test Redis client

    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()
```