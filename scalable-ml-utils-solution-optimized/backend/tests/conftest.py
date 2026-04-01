```python
import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import NullPool
import os
import asyncio
from datetime import timedelta

# For test database configuration
# Use an in-memory SQLite database for fast, isolated tests
TEST_DATABASE_URL = "sqlite+aiosqlite:///./test.db"

# Override settings for tests
os.environ["DATABASE_URL"] = TEST_DATABASE_URL
os.environ["SECRET_KEY"] = "super-secret-test-key"
os.environ["ALGORITHM"] = "HS256"
os.environ["ACCESS_TOKEN_EXPIRE_MINUTES"] = "1" # Short expiry for tests
os.environ["REDIS_URL"] = "redis://localhost:6379/1" # Use a different Redis DB for tests
os.environ["DATA_STORAGE_PATH"] = "/tmp/test_ml_utilities_storage" # Temporary storage for tests
os.environ["BACKEND_CORS_ORIGINS"] = "" # No CORS for tests

from backend.app.core.config import settings
from backend.app.main import app
from backend.app.db.base_class import Base
from backend.app.db.session import get_db, engine as app_engine
from backend.app.auth.security import create_access_token
from backend.app.crud.crud_user import user as crud_user
from backend.app.schemas.user import UserCreate

# Create a test engine for SQLite
test_engine = create_async_engine(
    TEST_DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False}, # Required for SQLite
    poolclass=NullPool # Each test will get a fresh connection
)

TestSessionLocal = async_sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False
)

@pytest_asyncio.fixture(scope="function")
async def db_session():
    """
    Fixture that provides a clean, independent database session for each test.
    It creates all tables before each test and drops them afterwards.
    """
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all) # Create tables
    
    async with TestSessionLocal() as session:
        yield session
    
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all) # Drop tables

@pytest_asyncio.fixture(scope="function")
async def client(db_session: AsyncSession):
    """
    Fixture that provides a FastAPI test client configured with the test database.
    """
    def override_get_db():
        return db_session

    app.dependency_overrides[get_db] = override_get_db
    
    async with AsyncClient(app=app, base_url="http://test") as c:
        yield c
    
    app.dependency_overrides.clear() # Clear overrides after the test

@pytest_asyncio.fixture(scope="function")
async def superuser_token_headers(client: AsyncClient, db_session: AsyncSession):
    """
    Fixture to create a superuser and return auth headers.
    """
    user_in = UserCreate(
        username=settings.FIRST_SUPERUSER_USERNAME,
        email=settings.FIRST_SUPERUSER_EMAIL,
        password=settings.FIRST_SUPERUSER_PASSWORD,
        is_superuser=True
    )
    user = await crud_user.get_by_email(db_session, email=user_in.email)
    if not user:
        user = await crud_user.create(db_session, obj_in=user_in)

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token = create_access_token(
        data={"user_id": user.id}, expires_delta=access_token_expires
    )
    return {"Authorization": f"Bearer {token}"}

@pytest_asyncio.fixture(scope="function")
async def normal_user_token_headers(client: AsyncClient, db_session: AsyncSession):
    """
    Fixture to create a normal user and return auth headers.
    """
    user_in = UserCreate(
        username="testuser",
        email="test@example.com",
        password="testpassword",
        is_superuser=False
    )
    user = await crud_user.get_by_email(db_session, email=user_in.email)
    if not user:
        user = await crud_user.create(db_session, obj_in=user_in)

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token = create_access_token(
        data={"user_id": user.id}, expires_delta=access_token_expires
    )
    return {"Authorization": f"Bearer {token}"}

@pytest_asyncio.fixture(scope="function")
async def test_user(db_session: AsyncSession):
    """Fixture to create and return a test user object."""
    user_in = UserCreate(
        username="anotheruser",
        email="another@example.com",
        password="anotherpassword",
        is_superuser=False
    )
    user = await crud_user.create(db_session, obj_in=user_in)
    return user

# Clean up test storage directory after all tests (session scope)
@pytest.fixture(scope="session", autouse=True)
def cleanup_test_storage():
    """Cleanup the temporary test storage directory."""
    test_storage_path = settings.DATA_STORAGE_PATH
    yield
    if os.path.exists(test_storage_path):
        import shutil
        shutil.rmtree(test_storage_path)
        print(f"Cleaned up test storage directory: {test_storage_path}")

```