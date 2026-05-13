import asyncio
from typing import AsyncGenerator, Generator
from uuid import uuid4

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.core.config import settings
from app.database.base import Base
from app.database.dependencies import get_db_session
from app.database.models import User, Merchant, UserRole
from app.core.security import get_password_hash, create_access_token
from datetime import timedelta
from app.crud.user import crud_user
from app.crud.merchant import crud_merchant
from app.core.logger import get_logger

logger = get_logger(__name__)

# --- Test Database Setup ---
# Use a separate test database
TEST_DATABASE_URL = settings.TEST_DATABASE_URL

test_engine = create_async_engine(TEST_DATABASE_URL, echo=False, future=True)
TestSessionLocal = sessionmaker(
    autocommit=False, autoflush=False, bind=test_engine, class_=AsyncSession, expire_on_commit=False
)

@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """Creates an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session", autouse=True)
async def setup_test_db():
    """
    Sets up and tears down the test database for the entire test session.
    """
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all) # Clear previous test data
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Test database created.")
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    logger.info("Test database dropped.")

@pytest.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Provides a transactional scope for a test, rolling back changes after each test.
    """
    async with TestSessionLocal() as session:
        await session.begin()
        yield session
        await session.rollback() # Rollback all changes
        await session.close()

@pytest.fixture(scope="function")
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """
    Provides a FastAPI test client configured to use the test database session.
    """
    def override_get_db_session():
        return db_session

    app.dependency_overrides[get_db_session] = override_get_db_session
    async with AsyncClient(app=app, base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()


# --- Authentication Fixtures ---

@pytest.fixture
async def create_user(db_session: AsyncSession):
    """Factory fixture to create a user."""
    users_created = []

    async def _create_user(
        email: str,
        password: str = "securepassword",
        is_superuser: bool = False,
        is_active: bool = True,
        role: UserRole = UserRole.MERCHANT,
        full_name: str = "Test User"
    ) -> User:
        user_in = {
            "email": email,
            "password": password,
            "is_superuser": is_superuser,
            "is_active": is_active,
            "role": role,
            "full_name": full_name
        }
        user = await crud_user.create(db_session, obj_in=user_in)
        users_created.append(user)
        await db_session.commit()
        await db_session.refresh(user)
        return user
    
    yield _create_user
    # No explicit cleanup needed due to db_session rollback

@pytest.fixture
async def create_merchant(db_session: AsyncSession):
    """Factory fixture to create a merchant associated with a user."""
    merchants_created = []

    async def _create_merchant(
        user: User,
        name: str = "Test Merchant",
        webhook_url: str = "http://test-webhook.com",
        api_key: str = "test_api_key_hash"
    ) -> Merchant:
        merchant_in = {
            "user_id": user.id,
            "name": name,
            "webhook_url": webhook_url,
            "api_key_hash": get_password_hash(api_key)
        }
        merchant = await crud_merchant.create(db_session, obj_in=merchant_in)
        merchants_created.append(merchant)
        await db_session.commit()
        await db_session.refresh(merchant)
        return merchant

    yield _create_merchant

@pytest.fixture
async def superuser_token_headers(client: AsyncClient, create_user) -> dict:
    """Fixture to provide authentication headers for a superuser."""
    superuser = await create_user(
        email="superuser@test.com", password="testpassword", is_superuser=True, role=UserRole.ADMIN
    )
    access_token = create_access_token(superuser.id, expires_delta=timedelta(minutes=15))
    return {"Authorization": f"Bearer {access_token}"}

@pytest.fixture
async def merchant_user_token_headers(client: AsyncClient, create_user, create_merchant) -> dict:
    """Fixture to provide authentication headers for a regular merchant user."""
    merchant_user = await create_user(
        email="merchant@test.com", password="testpassword", is_superuser=False, role=UserRole.MERCHANT
    )
    await create_merchant(merchant_user, name="Test Merchant Inc.", webhook_url="http://test.com/webhook")
    
    access_token = create_access_token(merchant_user.id, expires_delta=timedelta(minutes=15))
    return {"Authorization": f"Bearer {access_token}"}

@pytest.fixture
async def regular_user_token_headers(client: AsyncClient, create_user) -> dict:
    """Fixture to provide authentication headers for a regular (non-merchant, non-admin) user."""
    regular_user = await create_user(
        email="regular@test.com", password="testpassword", is_superuser=False, role=UserRole.CUSTOMER_PORTAL
    )
    access_token = create_access_token(regular_user.id, expires_delta=timedelta(minutes=15))
    return {"Authorization": f"Bearer {access_token}"}

```

#### `payment_processor/tests/api/test_auth_api.py`
```python