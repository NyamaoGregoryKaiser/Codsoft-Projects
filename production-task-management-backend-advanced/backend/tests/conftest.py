import asyncio
import os
import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.db.base import Base, get_db
from app.db.models import User, UserRole
from app.core.security import get_password_hash, create_access_token
from app.core.config import settings

# Override settings for tests
settings.DATABASE_URL = "sqlite+aiosqlite:///:memory:" # Use in-memory SQLite for speed
settings.REDIS_HOST = "localhost" # For tests, we'll use fakeredis or mock directly
settings.REDIS_PORT = 6379
settings.REDIS_DB = 0
settings.SECRET_KEY = "test-secret-key-for-testing"
settings.ACCESS_TOKEN_EXPIRE_MINUTES = 1 # Short expiry for tests
settings.FIRST_SUPERUSER_EMAIL = "testadmin@example.com"
settings.FIRST_SUPERUSER_PASSWORD = "testpassword"
settings.DEBUG = True # Enable debug for tests

# Setup in-memory SQLite for tests
test_engine = create_async_engine(settings.DATABASE_URL, echo=False)
TestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

@pytest_asyncio.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for each test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest_asyncio.fixture(scope="function")
async def db_session():
    """Create a clean database session for each test."""
    async with test_engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
        async with TestingSessionLocal(bind=connection) as session:
            yield session
            await session.rollback() # Rollback all transactions to clean up
    await test_engine.dispose()

@pytest_asyncio.fixture(scope="function")
async def client(db_session: AsyncSession):
    """Async HTTP client for testing FastAPI endpoints."""
    # Override the get_db dependency to use the test session
    def override_get_db():
        yield db_session
    app.dependency_overrides[get_db] = override_get_db
    
    # Mock Redis for tests if needed. For now, we'll let it try to connect to localhost:6379 or ignore.
    # A more robust solution would be to use `fakeredis`.
    
    # Initialize fakeredis for cache and rate limiter
    from fakeredis import FakeRedis
    from app.services.cache import redis_client, init_redis, close_redis
    from app.middleware.rate_limiter import initialize_rate_limiter
    
    # Replace the global redis_client with a FakeRedis instance
    global_redis_client_orig = redis_client
    app.state.redis = FakeRedis(decode_responses=True) # Use app.state to hold it
    app.dependency_overrides[init_redis] = lambda: None # Don't re-init real redis
    app.dependency_overrides[close_redis] = lambda: None # Don't close real redis
    
    # Manually set the redis_client in cache and rate_limiter modules
    import app.services.cache
    import app.middleware.rate_limiter
    app.services.cache.redis_client = app.state.redis
    app.middleware.rate_limiter.redis_client = app.state.redis
    
    await initialize_rate_limiter(app) # Initialize rate limiter with fakeredis

    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
    
    # Clean up fakeredis after tests
    app.state.redis.close()
    app.dependency_overrides.clear()
    app.services.cache.redis_client = global_redis_client_orig # Restore original

@pytest_asyncio.fixture(scope="function")
async def superuser_token_headers(client: AsyncClient, db_session: AsyncSession):
    """Fixture for superuser token headers."""
    email = settings.FIRST_SUPERUSER_EMAIL
    password = settings.FIRST_SUPERUSER_PASSWORD
    hashed_password = get_password_hash(password)
    superuser = User(
        email=email,
        hashed_password=hashed_password,
        full_name="Test Superuser",
        is_superuser=True,
        is_active=True,
        role=UserRole.ADMIN
    )
    db_session.add(superuser)
    await db_session.commit()
    await db_session.refresh(superuser)

    access_token = create_access_token(data={"sub": superuser.id})
    return {"Authorization": f"Bearer {access_token}"}

@pytest_asyncio.fixture(scope="function")
async def normal_user_token_headers(client: AsyncClient, db_session: AsyncSession):
    """Fixture for normal user token headers."""
    email = "testuser@example.com"
    password = "testpassword"
    hashed_password = get_password_hash(password)
    user = User(
        email=email,
        hashed_password=hashed_password,
        full_name="Test User",
        is_superuser=False,
        is_active=True,
        role=UserRole.USER
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    access_token = create_access_token(data={"sub": user.id})
    return {"Authorization": f"Bearer {access_token}"}, user

@pytest_asyncio.fixture(scope="function")
async def another_user_token_headers(client: AsyncClient, db_session: AsyncSession):
    """Fixture for another normal user token headers."""
    email = "anotheruser@example.com"
    password = "anotherpassword"
    hashed_password = get_password_hash(password)
    user = User(
        email=email,
        hashed_password=hashed_password,
        full_name="Another User",
        is_superuser=False,
        is_active=True,
        role=UserRole.USER
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    access_token = create_access_token(data={"sub": user.id})
    return {"Authorization": f"Bearer {access_token}"}, user