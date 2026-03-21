```python
import asyncio
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from typing import Generator, AsyncGenerator

from app.main import app
from app.db.base import Base
from app.db.session import get_db, engine as main_engine
from app.core.config import settings
from app.crud.users import crud_user
from app.schemas.user import UserCreate
from app.core.security import create_access_token
from app.core.caching import redis_client, init_redis_pool
from app.core.logger import setup_logging # Ensure logging is set up for tests
import logging

# Ensure logging is set up for tests
setup_logging()
logger = logging.getLogger(__name__)

# Override DB URL for tests
TEST_DATABASE_URL = settings.DATABASE_URL.replace(settings.POSTGRES_DB, f"{settings.POSTGRES_DB}_test")
settings.TESTING = True # Inform app that it's running in test mode
settings.DATABASE_URL = TEST_DATABASE_URL # Update for app context
settings.REDIS_URL = f"redis://{settings.REDIS_HOST}:{settings.REDIS_PORT}/1" # Use a different Redis DB for tests
settings.ACCESS_TOKEN_EXPIRE_MINUTES = 5 # Shorter token expiry for tests
settings.SECRET_KEY = "test_secret_key_for_testing_only_xyz" # Specific test secret

# Create a separate engine for tests
test_engine = create_async_engine(str(settings.DATABASE_URL), echo=False, pool_size=5)
TestAsyncSessionLocal = async_sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency override for tests to use a separate test database.
    Each test uses its own session and transaction.
    """
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all) # Create tables for each test run
        async with TestAsyncSessionLocal(bind=conn) as session:
            try:
                yield session
            finally:
                await session.close()
        await conn.run_sync(Base.metadata.drop_all) # Drop tables after each test run


app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="session", autouse=True)
async def initialize_test_environment():
    """Initializes Redis and ensures database is cleaned before/after test session."""
    logger.info("Initializing test environment: Setting up Redis and cleaning DB.")
    # Initialize Redis for tests
    await init_redis_pool()
    if redis_client:
        await redis_client.flushdb() # Clear test Redis DB before tests
        logger.info("Test Redis DB flushed.")

    # Ensure main engine is disposed if it was created
    if main_engine:
        await main_engine.dispose()
    
    # Create tables once for the test session if needed, or rely on per-test recreation
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    
    if redis_client:
        await redis_client.flushdb() # Clear test Redis DB after tests
        await redis_client.connection_pool.disconnect()
        logger.info("Test Redis DB flushed and disconnected.")
    
    await test_engine.dispose()
    logger.info("Test environment shutdown complete.")


@pytest.fixture(scope="function")
async def client() -> AsyncGenerator[AsyncClient, None]:
    """
    A fixture that provides an `httpx.AsyncClient` for making requests to the
    FastAPI app. It ensures a clean database state for each test function.
    """
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac


@pytest.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Provides a database session for direct CRUD operations in tests."""
    async with TestAsyncSessionLocal() as session:
        yield session


@pytest.fixture
async def superuser_token_headers(client: AsyncClient, db_session: AsyncSession) -> dict[str, str]:
    """
    Fixture to create a superuser and return headers with their JWT token.
    """
    user_in = UserCreate(
        email=settings.FIRST_SUPERUSER_EMAIL,
        password=settings.FIRST_SUPERUSER_PASSWORD,
        is_superuser=True,
        full_name="Test Superuser"
    )
    user = await crud_user.get_by_email(db_session, email=user_in.email)
    if not user:
        user = await crud_user.create(db_session, obj_in=user_in)
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
async def normal_user_token_headers(client: AsyncClient, db_session: AsyncSession) -> dict[str, str]:
    """
    Fixture to create a normal user and return headers with their JWT token.
    """
    user_in = UserCreate(
        email="normaluser@test.com",
        password="NormalUser!123",
        is_superuser=False,
        full_name="Test Normal User"
    )
    user = await crud_user.get_by_email(db_session, email=user_in.email)
    if not user:
        user = await crud_user.create(db_session, obj_in=user_in)

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    return {"Authorization": f"Bearer {token}"}

```