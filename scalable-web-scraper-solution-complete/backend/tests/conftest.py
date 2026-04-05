import asyncio
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from typing import AsyncIterator
from app.main import app
from app.core.database import Base, get_db
from app.core.config import settings
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.task import ScrapingTask, TaskStatus
from app.models.result import ScrapingResult
from app.crud.user import user as crud_user
from app.schemas.user import UserCreate
import fakeredis.aioredis
import redis.asyncio as aioredis
from fastapi_limiter import FastAPILimiter
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend

# Override the database URL for tests
settings.DATABASE_URL = settings.TEST_DATABASE_URL

# Create an in-memory SQLite database for fast testing (or a separate PostgreSQL test DB)
# For a full-scale project, using a dedicated test PostgreSQL container is better.
# SQLALCHEMY_DATABASE_URL = "sqlite+aiosqlite:///:memory:"
# For this comprehensive example, we'll stick to asyncpg with a separate test DB for realism.
# Ensure your docker-compose.yml or test setup creates/connects to this DB.

test_engine = create_async_engine(settings.DATABASE_URL, echo=False)
TestingSessionLocal = sessionmaker(
    autocommit=False, autoflush=False, bind=test_engine, class_=AsyncSession, expire_on_commit=False
)

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session", autouse=True)
async def setup_test_db():
    """
    Set up the test database: create tables, yield, then drop tables.
    This fixture runs once per test session.
    """
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all) # Ensure clean state
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest.fixture(scope="function")
async def db_session() -> AsyncIterator[AsyncSession]:
    """
    Provides a clean, independent database session for each test function.
    Rolls back transactions after each test.
    """
    connection = await test_engine.connect()
    transaction = await connection.begin()
    session = TestingSessionLocal(bind=connection)

    # Dependency override for FastAPI
    app.dependency_overrides[get_db] = lambda: session

    yield session

    await transaction.rollback()
    await connection.close()
    # Remove dependency override
    app.dependency_overrides.clear()


@pytest.fixture(scope="session", autouse=True)
async def test_redis():
    """
    Fixture for fakeredis (in-memory Redis) for testing caching and rate limiting.
    """
    _redis = fakeredis.aioredis.FakeRedis(decode_responses=True)
    
    # Initialize FastAPILimiter and FastAPICache with fakeredis
    await FastAPILimiter.init(_redis)
    FastAPICache.init(RedisBackend(_redis), prefix="fastapi-cache")

    yield _redis

    await FastAPILimiter.redis.close()
    await FastAPICache.get_backend()._redis.close()
    # Clear cache explicitly
    await FastAPICache.clear()


@pytest.fixture(scope="session")
async def client() -> AsyncIterator[AsyncClient]:
    """
    Provides an async HTTP client for API testing.
    """
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

@pytest.fixture(scope="function")
async def create_user(db_session: AsyncSession):
    """Fixture to create a regular user."""
    async def _create_user(email: str, password: str, role: UserRole = UserRole.USER):
        user_in = UserCreate(email=email, password=password, role=role)
        new_user = await crud_user.create(db_session, obj_in=user_in)
        return new_user
    return _create_user

@pytest.fixture(scope="function")
async def admin_user(create_user):
    """Fixture to create and return an admin user."""
    return await create_user("admin@test.com", "adminpassword", UserRole.ADMIN)

@pytest.fixture(scope="function")
async def regular_user(create_user):
    """Fixture to create and return a regular user."""
    return await create_user("user@test.com", "userpassword", UserRole.USER)

@pytest.fixture(scope="function")
async def admin_token_headers(admin_user: User, client: AsyncClient):
    """Fixture to get auth headers for the admin user."""
    response = await client.post(
        "/api/v1/auth/token",
        data={"username": admin_user.email, "password": "adminpassword"}
    )
    assert response.status_code == 200
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture(scope="function")
async def regular_user_token_headers(regular_user: User, client: AsyncClient):
    """Fixture to get auth headers for the regular user."""
    response = await client.post(
        "/api/v1/auth/token",
        data={"username": regular_user.email, "password": "userpassword"}
    )
    assert response.status_code == 200
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture(scope="function")
async def create_task(db_session: AsyncSession, regular_user: User):
    """Fixture to create a scraping task for a user."""
    async def _create_task(
        name: str = "Test Task",
        target_url: str = "http://example.com",
        css_selector: str = "h1",
        owner_id: int = None
    ):
        if owner_id is None:
            owner_id = regular_user.id
        task_data = {
            "name": name,
            "target_url": target_url,
            "css_selector": css_selector,
            "frequency_seconds": 60,
            "owner_id": owner_id,
            "status": TaskStatus.PENDING,
            "is_active": True
        }
        db_task = ScrapingTask(**task_data)
        db_session.add(db_task)
        await db_session.commit()
        await db_session.refresh(db_task)
        return db_task
    return _create_task

@pytest.fixture(scope="function")
async def create_result(db_session: AsyncSession, create_task):
    """Fixture to create a scraping result for a task."""
    async def _create_result(task_id: int = None):
        if task_id is None:
            task = await create_task()
            task_id = task.id
        result_data = {
            "task_id": task_id,
            "data": {"title": "Scraped Title"},
            "status_code": 200
        }
        db_result = ScrapingResult(**result_data)
        db_session.add(db_result)
        await db_session.commit()
        await db_session.refresh(db_result)
        return db_result
    return _create_result

```