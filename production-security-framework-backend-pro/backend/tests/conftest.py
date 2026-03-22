```python
import asyncio
from typing import AsyncGenerator

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.core.config import settings
from app.core.db import Base, get_db
from app.dependencies.auth import get_current_user, get_current_admin_user, block_token, is_token_blocked
from app.crud.user import crud_user
from app.schemas.user import UserCreate
from app.core.security import create_access_token, create_refresh_token
from datetime import timedelta

# Override settings for testing environment
settings.DATABASE_URL = "postgresql+asyncpg://user:password@localhost:5432/secure_task_test_db" # Use a dedicated test DB
settings.ACCESS_TOKEN_EXPIRE_MINUTES = 1 # Shorter expiry for tests
settings.SECRET_KEY = "test_secret_key"
settings.ENVIRONMENT = "testing"

# Create a test engine and session
test_engine = create_async_engine(settings.DATABASE_URL, echo=False)
TestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for each test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session", autouse=True)
async def setup_test_db():
    """Set up and tear down the test database."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Provide a clean database session for each test function."""
    async with TestingSessionLocal() as session:
        yield session
        await session.rollback() # Rollback changes after each test

@pytest.fixture(scope="function")
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Provide an AsyncClient for API testing."""
    def override_get_db():
        yield db_session

    # Temporarily override the get_db dependency in the main app
    app.dependency_overrides[get_db] = override_get_db
    
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
    
    app.dependency_overrides.clear() # Clear overrides after the test

@pytest.fixture(scope="function")
async def test_user(db_session: AsyncSession):
    """Create a regular test user."""
    user_in = UserCreate(email="test@example.com", password="testpassword123", full_name="Test User")
    user = await crud_user.create(db_session, obj_in=user_in)
    return user

@pytest.fixture(scope="function")
async def test_admin_user(db_session: AsyncSession):
    """Create a test admin user."""
    admin_in = UserCreate(email="admin@test.com", password="adminpassword123", full_name="Admin User", role="admin")
    admin = await crud_user.create(db_session, obj_in=admin_in)
    return admin

@pytest.fixture(scope="function")
async def get_test_access_token(test_user):
    """Returns an access token for the test user."""
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return create_access_token(
        data={"user_id": test_user.id, "email": test_user.email, "role": test_user.role},
        expires_delta=access_token_expires
    )

@pytest.fixture(scope="function")
async def get_test_refresh_token(test_user):
    """Returns a refresh token for the test user."""
    refresh_token_expires = timedelta(minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES)
    return create_refresh_token(
        data={"user_id": test_user.id, "email": test_user.email, "role": test_user.role},
        expires_delta=refresh_token_expires
    )

@pytest.fixture(scope="function")
async def get_admin_access_token(test_admin_user):
    """Returns an access token for the test admin user."""
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return create_access_token(
        data={"user_id": test_admin_user.id, "email": test_admin_user.email, "role": test_admin_user.role},
        expires_delta=access_token_expires
    )

@pytest.fixture(scope="function")
async def authorized_client(client: AsyncClient, get_test_access_token: str):
    """Client authenticated as a regular user."""
    client.headers.update({"Authorization": f"Bearer {get_test_access_token}"})
    return client

@pytest.fixture(scope="function")
async def admin_authorized_client(client: AsyncClient, get_admin_access_token: str):
    """Client authenticated as an admin user."""
    client.headers.update({"Authorization": f"Bearer {get_admin_access_token}"})
    return client

@pytest.fixture(autouse=True)
def override_token_blocklist():
    """Overrides redis block_token/is_token_blocked for tests."""
    blocked_tokens = set()

    async def mock_is_token_blocked(token: str) -> bool:
        return token in blocked_tokens

    async def mock_block_token(token: str, expires_at):
        blocked_tokens.add(token)

    app.dependency_overrides[block_token] = mock_block_token
    app.dependency_overrides[is_token_blocked] = mock_is_token_blocked
    yield
    app.dependency_overrides.pop(block_token)
    app.dependency_overrides.pop(is_token_blocked)

# Fixture to provide current user without actual DB lookup for some tests
@pytest.fixture
def mock_current_user(test_user):
    async def _mock_current_user():
        return test_user
    app.dependency_overrides[get_current_user] = _mock_current_user
    app.dependency_overrides[get_current_admin_user] = _mock_current_user # This would usually be a separate mock
    yield
    app.dependency_overrides.pop(get_current_user)
    app.dependency_overrides.pop(get_current_admin_user)
```