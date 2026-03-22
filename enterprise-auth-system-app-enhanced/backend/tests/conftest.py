import pytest
import pytest_asyncio
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from app.db.base import Base
from app.main import app
from app.core.config import settings
from app.dependencies import get_db, get_redis_client
from app.services.cache import get_redis_client as get_real_redis_client
import httpx
import redis.asyncio as redis
import os

# Override test database URL for isolating tests
TEST_DATABASE_URL = "postgresql+asyncpg://test_user:test_password@localhost:5433/test_db"
# If running with docker-compose test DB, use service name:
# TEST_DATABASE_URL = "postgresql+asyncpg://test_user:test_password@test_db:5432/test_db"

@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"

# Setup for test database engine and session
@pytest_asyncio.fixture(scope="session")
async def test_db_engine():
    # Make sure to create a separate test database and user in your local PostgreSQL setup
    # Or, if using docker-compose for tests, configure a test_db service.
    # For simplicity, during local dev testing, `localhost:5433` is assumed for a test DB.
    # For CI/CD, `test_db:5432` would be more appropriate.
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    yield engine
    await engine.dispose()

@pytest_asyncio.fixture(scope="session")
async def test_db_session_factory(test_db_engine):
    """Creates a configured async_sessionmaker for the test database."""
    return async_sessionmaker(
        autocommit=False, autoflush=False, bind=test_db_engine, expire_on_commit=False
    )

@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_test_db(test_db_engine):
    """Creates all tables before tests and drops them after."""
    async with test_db_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all) # Ensure clean slate
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_db_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture(scope="function")
async def db_session(test_db_session_factory) -> AsyncGenerator[AsyncSession, None]:
    """Provides a transactional database session for each test function."""
    async with test_db_session_factory() as session:
        # Begin a transaction
        await session.begin()
        yield session
        # Rollback the transaction to ensure no data persists
        await session.rollback()
        await session.close()


@pytest_asyncio.fixture(scope="session")
async def test_redis_client():
    """Provides a test Redis client, ensuring it's for testing."""
    # Use a different DB number or port for test Redis to avoid conflicts
    test_redis = redis.Redis(host="localhost", port=6379, db=1, decode_responses=True)
    try:
        await test_redis.ping()
        await test_redis.flushdb() # Clear Redis before tests
        yield test_redis
    finally:
        await test_redis.flushdb()
        await test_redis.close()

@pytest_asyncio.fixture(scope="function")
async def client(db_session: AsyncSession, test_redis_client: redis.Redis) -> AsyncGenerator[httpx.AsyncClient, None]:
    """
    Provides an asynchronous HTTP client for FastAPI,
    overriding DB and Redis dependencies with test versions.
    """
    def override_get_db():
        yield db_session

    def override_get_redis_client():
        return test_redis_client

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_redis_client] = override_get_redis_client

    async with httpx.AsyncClient(app=app, base_url="http://test") as c:
        yield c

    app.dependency_overrides.clear()
```