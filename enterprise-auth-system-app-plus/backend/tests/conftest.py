```python
import asyncio
from typing import AsyncGenerator

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.core.security import get_password_hash
from app.db.base import Base
from app.db.session import async_session as BaseAsyncSession
from app.db.models import User, Post, RefreshToken, PasswordResetToken
from app.main import app
from app.crud.user import create_user
from app.schemas.user import UserCreate

# Override test database URL
TEST_DATABASE_URL = "postgresql+asyncpg://user:password@db:5432/test_db" # Use a separate test database

# Create a test engine and session
test_engine = create_async_engine(
    TEST_DATABASE_URL,
    echo=False,
    future=True
)

TestingSessionLocal = async_sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=test_engine,
    class_=AsyncSession
)

async def override_get_db() -> AsyncGenerator:
    """Override the get_db dependency to use the test database."""
    async with TestingSessionLocal() as session:
        yield session

# Apply the override
app.dependency_overrides[app.dependency_overrides.get("get_db", lambda: None)] = override_get_db # Safely override

@pytest.fixture(scope="session")
def event_loop():
    """Fixture to provide a session-scoped event loop for async tests."""
    policy = asyncio.get_event_loop_policy()
    loop = policy.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session", autouse=True)
async def setup_test_db():
    """
    Sets up the test database: drops, creates tables, and seeds initial data.
    Runs once per test session.
    """
    print(f"\nSetting up test database at {TEST_DATABASE_URL}...")
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    
    # Seed an admin user for testing
    async with TestingSessionLocal() as session:
        admin_user_in = UserCreate(
            email="testadmin@example.com",
            password="testpassword",
            first_name="Test",
            last_name="Admin",
            is_admin=True,
            is_active=True
        )
        hashed_password = get_password_hash(admin_user_in.password)
        db_user = User(
            email=admin_user_in.email,
            hashed_password=hashed_password,
            first_name=admin_user_in.first_name,
            last_name=admin_user_in.last_name,
            is_active=admin_user_in.is_active,
            is_admin=admin_user_in.is_admin,
        )
        session.add(db_user)
        await session.commit()
        await session.refresh(db_user)
    
    print("Test database setup complete.")
    yield
    print("Tearing down test database...")
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    print("Test database teardown complete.")


@pytest.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Provides a clean, independent database session for each test function.
    Rollbacks transactions after each test.
    """
    async with test_engine.begin() as connection:
        async with TestingSessionLocal(bind=connection) as session:
            yield session
            await session.rollback() # Rollback all changes after the test


@pytest.fixture(scope="function")
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """
    Provides an async test client for FastAPI.
    """
    # Override the get_db dependency for the test client
    app.dependency_overrides[app.dependency_overrides.get("get_db", lambda: None)] = lambda: db_session
    
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
    
    # Clean up overrides after test
    app.dependency_overrides = {}


@pytest.fixture(scope="function")
async def admin_user(db_session: AsyncSession) -> User:
    """Fixture to get the seeded admin user."""
    user = await db_session.execute(
        User.__table__.select().where(User.email == "testadmin@example.com")
    )
    return user.scalar_one()

@pytest.fixture(scope="function")
async def admin_headers(client: AsyncClient, admin_user: User) -> dict:
    """Fixture to get authentication headers for the admin user."""
    login_data = {"username": admin_user.email, "password": "testpassword"}
    response = await client.post("/api/v1/auth/login", data=login_data)
    assert response.status_code == 200
    token = response.json()["access_token"]
    refresh_token = response.cookies.get("refresh_token")
    return {"Authorization": f"Bearer {token}", "Cookie": f"refresh_token={refresh_token}"}


@pytest.fixture(scope="function")
async def test_user(db_session: AsyncSession) -> User:
    """Fixture to create and return a regular test user."""
    user_in = UserCreate(
        email="testuser@example.com",
        password="testpassword",
        first_name="Test",
        last_name="User"
    )
    user = await create_user(db_session, user_in)
    return user

@pytest.fixture(scope="function")
async def test_user_headers(client: AsyncClient, test_user: User) -> dict:
    """Fixture to get authentication headers for a regular test user."""
    login_data = {"username": test_user.email, "password": "testpassword"}
    response = await client.post("/api/v1/auth/login", data=login_data)
    assert response.status_code == 200
    token = response.json()["access_token"]
    refresh_token = response.cookies.get("refresh_token")
    return {"Authorization": f"Bearer {token}", "Cookie": f"refresh_token={refresh_token}"}

```