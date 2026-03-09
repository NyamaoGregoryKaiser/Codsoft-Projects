import asyncio
from typing import AsyncGenerator, Generator

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.core.database import Base, get_db
from app.main import app
from app.models.user import User as DBUser
from app.schemas.user import UserCreate
from app.core.security import get_password_hash # Import for seeding test user

# --- Test Database Setup ---
# Use a separate test database for isolation
TEST_DATABASE_URL = "postgresql+asyncpg://user:password@db:5432/test_scraper_db"

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session")
async def async_test_engine():
    """Fixture for an async SQLAlchemy engine for tests."""
    # Ensure the test DB exists before running tests
    temp_engine = create_async_engine(TEST_DATABASE_URL.replace("/test_scraper_db", "/postgres"), isolation_level="AUTOCOMMIT")
    async with temp_engine.connect() as conn:
        await conn.execute(f"DROP DATABASE IF EXISTS test_scraper_db WITH (FORCE);")
        await conn.execute(f"CREATE DATABASE test_scraper_db;")
    await temp_engine.dispose()

    engine = create_async_engine(TEST_DATABASE_URL, future=True, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest.fixture(scope="function")
async def async_test_session(async_test_engine) -> AsyncGenerator[AsyncSession, None]:
    """Fixture for an async SQLAlchemy session for each test function."""
    AsyncTestingSessionLocal = sessionmaker(
        class_=AsyncSession,
        autocommit=False,
        autoflush=False,
        bind=async_test_engine,
        expire_on_commit=False,
    )
    async with AsyncTestingSessionLocal() as session:
        yield session
        # Clean up database after each test
        for table in reversed(Base.metadata.sorted_tables):
            await session.execute(table.delete())
        await session.commit()


@pytest.fixture(scope="function")
async def override_get_db(async_test_session: AsyncSession):
    """Override the get_db dependency to use the test session."""
    async def _get_test_db():
        yield async_test_session
    app.dependency_overrides[get_db] = _get_test_db
    yield
    app.dependency_overrides = {} # Clear overrides after the test

# --- Test Users ---
@pytest.fixture(scope="function")
async def test_user_data() -> UserCreate:
    """Fixture for test user creation data."""
    return UserCreate(email="test@example.com", password="testpassword")

@pytest.fixture(scope="function")
async def test_superuser_data() -> UserCreate:
    """Fixture for test superuser creation data."""
    return UserCreate(email="superuser@example.com", password="superpassword", is_superuser=True)

@pytest.fixture(scope="function")
async def test_user(async_test_session: AsyncSession, test_user_data: UserCreate) -> DBUser:
    """Fixture for creating and returning a test user."""
    from app.crud.user import user as crud_user
    user = await crud_user.create(async_test_session, obj_in=test_user_data)
    return user

@pytest.fixture(scope="function")
async def test_superuser(async_test_session: AsyncSession, test_superuser_data: UserCreate) -> DBUser:
    """Fixture for creating and returning a test superuser."""
    from app.crud.user import user as crud_user
    superuser = await crud_user.create(async_test_session, obj_in=test_superuser_data)
    return superuser

# --- Test API Client ---
@pytest.fixture(scope="function")
async def client(override_get_db) -> AsyncGenerator[AsyncClient, None]:
    """Fixture for an async HTTP client to test FastAPI endpoints."""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

# --- Authentication Fixtures ---
@pytest.fixture(scope="function")
async def auth_headers(client: AsyncClient, test_user: DBUser, test_user_data: UserCreate) -> dict:
    """Fixture for authenticated headers for a regular user."""
    response = await client.post(
        "/api/v1/auth/login",
        data={"username": test_user_data.email, "password": test_user_data.password},
    )
    assert response.status_code == 200
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture(scope="function")
async def superuser_auth_headers(client: AsyncClient, test_superuser: DBUser, test_superuser_data: UserCreate) -> dict:
    """Fixture for authenticated headers for a superuser."""
    response = await client.post(
        "/api/v1/auth/login",
        data={"username": test_superuser_data.email, "password": test_superuser_data.password},
    )
    assert response.status_code == 200
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
```
---