import asyncio
import os
import sys
from typing import Generator, AsyncGenerator, Any

import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import NullPool

# Add the project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from main import app
from app.core.config import settings
from app.core.database import get_db, Base
from app.models.user import User # Import models for table creation/deletion
from app.models.project import Project
from app.models.task import Task
from app.models.comment import Comment
from app.core.security import get_password_hash
from app.core.cache import init_redis, close_redis, get_redis_client

# Override settings for testing
settings.FASTAPI_ENV = "testing"
settings.DATABASE_URL = "postgresql+asyncpg://testuser:testpassword@localhost:5433/test_db" # Use a separate test DB
settings.REDIS_URL = "redis://localhost:6380/0" # Use a separate test Redis DB
settings.SECRET_KEY = "test_secret_key"
settings.ACCESS_TOKEN_EXPIRE_MINUTES = 1

# Create a test engine
test_engine = create_async_engine(
    str(settings.DATABASE_URL),
    echo=False,
    poolclass=NullPool,
    future=True
)

# Create a test session local
TestingSessionLocal = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)

@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_test_database():
    """Fixture to set up and tear down the test database."""
    print("Setting up test database...")
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all) # Ensure clean state
        await conn.run_sync(Base.metadata.create_all)
    print("Test database created.")
    
    # Initialize test Redis
    await init_redis()

    yield

    print("Tearing down test database...")
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    print("Test database dropped.")
    
    # Close test Redis
    await close_redis()

@pytest_asyncio.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Fixture to provide a database session for each test."""
    async with TestingSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

# Override the get_db dependency for tests
@pytest_asyncio.fixture(scope="function")
async def override_get_db(db_session: AsyncSession) -> AsyncGenerator[AsyncSession, None]:
    """Overrides the default get_db dependency to use the test session."""
    yield db_session

# Override the get_redis_client dependency for tests
@pytest_asyncio.fixture(scope="function")
async def override_get_redis_client() -> AsyncGenerator[Redis, None]:
    """Overrides the default get_redis_client dependency to use the test Redis client."""
    r = await get_redis_client()
    # Ensure Redis is clean for each test that uses it
    await r.flushdb()
    yield r

app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[get_redis_client] = override_get_redis_client


@pytest_asyncio.fixture(scope="function")
async def client() -> AsyncGenerator[AsyncClient, None]:
    """Fixture for an asynchronous test client."""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

@pytest_asyncio.fixture(scope="function")
async def admin_user(db_session: AsyncSession) -> User:
    """Creates and returns an admin user."""
    admin = User(
        email="admin_test@example.com",
        hashed_password=get_password_hash("testpassword"),
        is_active=True,
        is_admin=True,
    )
    db_session.add(admin)
    await db_session.commit()
    await db_session.refresh(admin)
    return admin

@pytest_asyncio.fixture(scope="function")
async def regular_user(db_session: AsyncSession) -> User:
    """Creates and returns a regular user."""
    regular = User(
        email="user_test@example.com",
        hashed_password=get_password_hash("testpassword"),
        is_active=True,
        is_admin=False,
    )
    db_session.add(regular)
    await db_session.commit()
    await db_session.refresh(regular)
    return regular

@pytest_asyncio.fixture(scope="function")
async def admin_token(client: AsyncClient, admin_user: User) -> str:
    """Generates an access token for the admin user."""
    response = await client.post(
        f"{settings.API_V1_STR}/auth/login",
        data={"username": admin_user.email, "password": "testpassword"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    assert response.status_code == 200
    return response.json()["access_token"]

@pytest_asyncio.fixture(scope="function")
async def regular_user_token(client: AsyncClient, regular_user: User) -> str:
    """Generates an access token for the regular user."""
    response = await client.post(
        f"{settings.API_V1_STR}/auth/login",
        data={"username": regular_user.email, "password": "testpassword"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    assert response.status_code == 200
    return response.json()["access_token"]

@pytest_asyncio.fixture(scope="function")
async def auth_admin_headers(admin_token: str) -> Dict[str, str]:
    """Returns headers with admin authentication token."""
    return {"Authorization": f"Bearer {admin_token}"}

@pytest_asyncio.fixture(scope="function")
async def auth_regular_user_headers(regular_user_token: str) -> Dict[str, str]:
    """Returns headers with regular user authentication token."""
    return {"Authorization": f"Bearer {regular_user_token}"}

```