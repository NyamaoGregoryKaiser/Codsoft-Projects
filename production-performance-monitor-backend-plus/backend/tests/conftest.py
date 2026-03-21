import asyncio
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
import os
from typing import Generator, AsyncGenerator
from unittest.mock import AsyncMock, patch

# Adjust path to import from app
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../')))

from app.main import app
from app.database.session import get_db_session
from app.database.base import Base
from app.database.models import User, Application, Metric, MetricData, MetricType # Import all models
from app.core.config import settings
from app.core.security import get_password_hash, create_access_token
from app.core.logging_config import logger # Import logger


# Use a dedicated test database URL
TEST_DATABASE_URL = "postgresql+asyncpg://horizon_user:horizon_password@db:5432/horizon_test_db"

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the session."""
    policy = asyncio.get_event_loop_policy()
    loop = policy.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session", autouse=True)
async def setup_test_db():
    """
    Sets up a clean test database for the entire test session.
    Drops existing tables, creates new ones, and yields control.
    After tests, drops tables again.
    """
    test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    # Override the app's database engine for tests
    settings.DATABASE_URL = TEST_DATABASE_URL

    yield

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await test_engine.dispose()


@pytest.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Provides a transactional scope for a test function.
    Rollbacks all changes after the test.
    """
    test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    TestingSessionLocal = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    async with test_engine.begin() as conn:
        # Begin a transaction for the test
        transaction = await conn.begin_nested()
        async with TestingSessionLocal(bind=conn) as session:
            # Override dependency in FastAPI app
            app.dependency_overrides[get_db_session] = lambda: session
            yield session
            # Rollback the transaction to clean up changes
            await transaction.rollback()
    
    await test_engine.dispose()
    # Reset overrides after each test
    app.dependency_overrides = {}


@pytest.fixture(scope="function")
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """
    Provides an asynchronous test client for the FastAPI application.
    """
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac


@pytest.fixture
async def admin_user(db_session: AsyncSession) -> User:
    """Fixture to create an admin user."""
    user = User(
        email="admin@test.com",
        hashed_password=get_password_hash("testpassword"),
        is_active=True,
        is_admin=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def regular_user(db_session: AsyncSession) -> User:
    """Fixture to create a regular user."""
    user = User(
        email="user@test.com",
        hashed_password=get_password_hash("testpassword"),
        is_active=True,
        is_admin=False,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
def admin_token(admin_user: User) -> str:
    """Fixture to get an access token for the admin user."""
    return create_access_token(
        data={"user_id": admin_user.id, "email": admin_user.email, "is_admin": admin_user.is_admin}
    )


@pytest.fixture
def regular_user_token(regular_user: User) -> str:
    """Fixture to get an access token for the regular user."""
    return create_access_token(
        data={"user_id": regular_user.id, "email": regular_user.email, "is_admin": regular_user.is_admin}
    )


@pytest.fixture
async def application_admin(db_session: AsyncSession, admin_user: User) -> Application:
    """Fixture to create an application owned by the admin user."""
    app_obj = Application(
        name="AdminApp",
        description="App owned by admin",
        api_key="admin-api-key-123",
        owner_id=admin_user.id,
    )
    db_session.add(app_obj)
    await db_session.commit()
    await db_session.refresh(app_obj)
    return app_obj


@pytest.fixture
async def application_user(db_session: AsyncSession, regular_user: User) -> Application:
    """Fixture to create an application owned by the regular user."""
    app_obj = Application(
        name="UserApp",
        description="App owned by regular user",
        api_key="user-api-key-456",
        owner_id=regular_user.id,
    )
    db_session.add(app_obj)
    await db_session.commit()
    await db_session.refresh(app_obj)
    return app_obj

@pytest.fixture
async def metric_for_admin_app(db_session: AsyncSession, application_admin: Application) -> Metric:
    """Fixture to create a metric for an admin-owned application."""
    metric_obj = Metric(
        app_id=application_admin.id,
        name="cpu_usage",
        unit="%",
        metric_type=MetricType.GAUGE,
        threshold_warning=70.0,
        threshold_critical=90.0
    )
    db_session.add(metric_obj)
    await db_session.commit()
    await db_session.refresh(metric_obj)
    return metric_obj

@pytest.fixture
async def metric_data_points(db_session: AsyncSession, metric_for_admin_app: Metric) -> list[MetricData]:
    """Fixture to create some metric data points."""
    data_points = []
    now = datetime.utcnow()
    for i in range(5):
        data_points.append(MetricData(
            metric_id=metric_for_admin_app.id,
            value=60.0 + i,
            timestamp=now - timedelta(minutes=i)
        ))
    db_session.add_all(data_points)
    await db_session.commit()
    for dp in data_points:
        await db_session.refresh(dp)
    return data_points

# Mock Redis for rate limiting and caching tests
@pytest.fixture(autouse=True)
def mock_redis():
    """
    Mocks the redis.asyncio client to prevent actual Redis connections during tests.
    """
    with patch("redis.asyncio.Redis", new=AsyncMock) as mock_redis_cls:
        # Mock methods that FastAPILimiter and our services use
        mock_instance = mock_redis_cls.return_value
        mock_instance.ping.return_value = True
        mock_instance.get.return_value = None
        mock_instance.setex.return_value = True
        mock_instance.incr.return_value = 1
        mock_instance.expire.return_value = True
        mock_instance.exists.return_value = 0
        mock_instance.set.return_value = True
        mock_instance.delete.return_value = 1 # Assume deletion is successful

        # FastAPILimiter also uses `pipeline` and `execute`
        mock_pipeline = AsyncMock()
        mock_pipeline.get.return_value = mock_pipeline
        mock_pipeline.set.return_value = mock_pipeline
        mock_pipeline.incr.return_value = mock_pipeline
        mock_pipeline.expire.return_value = mock_pipeline
        mock_pipeline.execute.return_value = [None, None, 1, True] # Example return for common sequence
        mock_instance.pipeline.return_value.__aenter__.return_value = mock_pipeline
        mock_instance.pipeline.return_value.__aexit__.return_value = None

        yield mock_redis_cls