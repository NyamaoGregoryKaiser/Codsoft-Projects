```python
import asyncio
import os
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

# Set environment variables for testing before importing config
os.environ["POSTGRES_SERVER"] = "localhost" # Or a test specific DB service
os.environ["POSTGRES_USER"] = "testuser"
os.environ["POSTGRES_PASSWORD"] = "testpassword"
os.environ["POSTGRES_DB"] = "testdb"
os.environ["SECRET_KEY"] = "super-secret-test-key"
os.environ["FIRST_SUPERUSER_EMAIL"] = "testadmin@example.com"
os.environ["FIRST_SUPERUSER_PASSWORD"] = "testadminpassword"
os.environ["REDIS_HOST"] = "localhost" # Mock or ensure Redis is available for tests

from app.main import app
from app.db.base import Base
from app.db.session import engine, SessionLocal, get_db
from app.core.config import settings
from app.core.security import get_password_hash
from app.schemas.user import UserCreate
from app.crud.users import crud_user


# Override the database URL for tests
TEST_DATABASE_URL = f"postgresql+asyncpg://{settings.POSTGRES_USER}:{settings.POSTGRES_PASSWORD}@{settings.POSTGRES_SERVER}:5432/{settings.POSTGRES_DB}_test"

# Create a test engine and session
test_engine = create_async_engine(TEST_DATABASE_URL, echo=False, future=True)
TestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

async def override_get_db() -> AsyncSession:
    async with TestingSessionLocal() as session:
        yield session

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="session")
def event_loop(request):
    """Create an instance of the default event loop for each test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session", autouse=True)
async def setup_test_db():
    """Setup and teardown the test database."""
    print("Setting up test database...")
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    print("Test database setup complete.")
    yield
    print("Tearing down test database...")
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    print("Test database teardown complete.")

@pytest.fixture(scope="function", autouse=True)
async def clear_and_seed_db(setup_test_db):
    """Clear tables and seed initial data for each test function."""
    async with TestingSessionLocal() as session:
        # Clear tables (order matters due to foreign keys)
        for table in reversed(Base.metadata.sorted_tables):
             await session.execute(table.delete())
        await session.commit()

        # Seed initial admin user
        superuser_email = settings.FIRST_SUPERUSER_EMAIL
        existing_superuser = await crud_user.get_by_email(session, email=superuser_email)
        if not existing_superuser:
            user_in = UserCreate(
                email=superuser_email,
                password=settings.FIRST_SUPERUSER_PASSWORD,
                full_name="Test Admin",
                is_superuser=True
            )
            await crud_user.create(session, obj_in=user_in)
            await session.commit()

        yield # Run the test

        # Clean up after each test if necessary (though drop_all handles this mostly)
        for table in reversed(Base.metadata.sorted_tables):
             await session.execute(table.delete())
        await session.commit()

@pytest.fixture(scope="function")
async def client():
    """Test client for FastAPI."""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

@pytest.fixture(scope="function")
async def db_session():
    """Provides a database session for direct CRUD operations in tests."""
    async with TestingSessionLocal() as session:
        yield session

@pytest.fixture
async def superuser_token_headers(client: AsyncClient, db_session: AsyncSession):
    """Fixture to get headers for an authenticated superuser."""
    response = await client.post(
        f"{settings.API_V1_STR}/auth/login",
        data={"username": settings.FIRST_SUPERUSER_EMAIL, "password": settings.FIRST_SUPERUSER_PASSWORD}
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
async def regular_user_token_headers(client: AsyncClient, db_session: AsyncSession):
    """Fixture to get headers for an authenticated regular user."""
    test_email = "testuser@example.com"
    test_password = "testpassword"
    user_in = UserCreate(email=test_email, password=test_password, full_name="Test User", is_superuser=False)
    await crud_user.create(db_session, obj_in=user_in)
    await db_session.commit()

    response = await client.post(
        f"{settings.API_V1_STR}/auth/login",
        data={"username": test_email, "password": test_password}
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
```