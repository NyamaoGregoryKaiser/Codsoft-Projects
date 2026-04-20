import pytest
import asyncio
from typing import AsyncGenerator
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

from app.main import app
from app.core.config import settings
from app.db.base import Base
from app.models.user import User
from app.core.security import get_password_hash
from app.dependencies.database import get_db

# Override database URL for tests
# Make sure your test PostgreSQL DB is running on localhost:5432 with `test_dataviz_db`
TEST_DATABASE_URL = "postgresql+asyncpg://test_user:test_password@localhost:5432/test_dataviz_db"

@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"

@pytest.fixture(scope="session", autouse=True)
async def setup_test_db():
    """
    Sets up a clean test database for each test session.
    """
    test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all) # Clear existing tables
        await conn.run_sync(Base.metadata.create_all) # Create fresh tables

    TestAsyncSessionLocal = async_sessionmaker(
        autocommit=False, autoflush=False, bind=test_engine, class_=AsyncSession
    )

    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        async with TestAsyncSessionLocal() as session:
            try:
                yield session
            finally:
                await session.close()
    
    app.dependency_overrides[get_db] = override_get_db

    yield # Let tests run

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all) # Tear down tables
    await test_engine.dispose()
    app.dependency_overrides = {} # Clear overrides

@pytest.fixture(scope="function")
async def db_session(setup_test_db) -> AsyncGenerator[AsyncSession, None]:
    """
    Provides a database session for each test function, rolling back changes.
    """
    async with AsyncSessionLocal() as session: # Use app's actual session for rollback
        try:
            yield session
            await session.rollback() # Rollback all changes after test
        finally:
            await session.close()

@pytest.fixture(scope="function")
async def client(db_session) -> AsyncGenerator[AsyncClient, None]:
    """
    Provides an async HTTP client for testing FastAPI endpoints.
    """
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

@pytest.fixture(scope="function")
async def test_user_data():
    return {
        "email": "test@example.com",
        "password": "testpassword",
        "is_active": True,
        "is_superuser": False,
    }

@pytest.fixture(scope="function")
async def test_admin_user_data():
    return {
        "email": "admin@example.com",
        "password": "adminpassword",
        "is_active": True,
        "is_superuser": True,
    }

@pytest.fixture(scope="function")
async def create_test_user(db_session: AsyncSession, test_user_data) -> User:
    """Creates and returns a non-admin test user."""
    user = User(
        email=test_user_data["email"],
        hashed_password=get_password_hash(test_user_data["password"]),
        is_active=test_user_data["is_active"],
        is_superuser=test_user_data["is_superuser"],
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user

@pytest.fixture(scope="function")
async def create_test_admin_user(db_session: AsyncSession, test_admin_user_data) -> User:
    """Creates and returns an admin test user."""
    user = User(
        email=test_admin_user_data["email"],
        hashed_password=get_password_hash(test_admin_user_data["password"]),
        is_active=test_admin_user_data["is_active"],
        is_superuser=test_admin_user_data["is_superuser"],
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user

@pytest.fixture(scope="function")
async def get_auth_token(client: AsyncClient, test_user_data):
    """Authenticates a test user and returns their JWT token."""
    response = await client.post(
        "/api/v1/users/login",
        data={"username": test_user_data["email"], "password": test_user_data["password"]},
    )
    assert response.status_code == 200
    return response.json()["access_token"]

@pytest.fixture(scope="function")
async def get_admin_auth_token(client: AsyncClient, test_admin_user_data):
    """Authenticates a test admin user and returns their JWT token."""
    response = await client.post(
        "/api/v1/users/login",
        data={"username": test_admin_user_data["email"], "password": test_admin_user_data["password"]},
    )
    assert response.status_code == 200
    return response.json()["access_token"]

# Override Redis for tests to avoid conflicts
@pytest.fixture(scope="function", autouse=True)
async def clear_redis_for_tests():
    from redis.asyncio import Redis
    from app.core.config import settings
    # Connect to the test Redis instance defined in docker-compose.test.yml
    test_redis = Redis(host="localhost", port=settings.REDIS_PORT, db=settings.REDIS_DB, decode_responses=True)
    await test_redis.flushdb()
    yield
    await test_redis.close()