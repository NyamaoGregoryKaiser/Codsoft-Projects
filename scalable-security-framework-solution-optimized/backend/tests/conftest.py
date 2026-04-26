```python
import pytest
from httpx import AsyncClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.db.base import Base
from app.db.session import get_db
from app.db.init_db import init_db
from app.core.config import settings
from app.core.security import get_password_hash
from app.db.models.user import User
from app.db.models.item import Item
from app.crud.user import crud_user
from app.schemas.user import UserCreate

# Override database URL for testing
TEST_DATABASE_URL = "postgresql+psycopg2://testuser:testpassword@localhost:5432/testdb"
settings.DATABASE_URL = TEST_DATABASE_URL # Ensure app uses test DB
settings.REDIS_DB = 1 # Use a different Redis DB for tests

# Create a synchronous engine for tests (Alembic needs this)
test_engine = create_engine(TEST_DATABASE_URL, pool_pre_ping=True)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    """Sets up and tears down the test database for the entire test session."""
    # Ensure all tables are dropped and recreated
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)

@pytest.fixture(scope="function")
def db_session():
    """Provides a fresh, isolated database session for each test function."""
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    # Clean and seed the database for each test
    for table in reversed(Base.metadata.sorted_tables):
        session.execute(f"TRUNCATE TABLE {table.name} RESTART IDENTITY CASCADE;")
    session.commit() # Commit truncate

    # Seed initial data (e.g., admin and regular user) for each test
    init_db(session)

    yield session

    session.close()
    transaction.rollback() # Rollback changes after each test
    connection.close()

@pytest.fixture(scope="function")
def override_get_db(db_session):
    """Overrides the FastAPI's get_db dependency to use the test session."""
    def _override_get_db():
        yield db_session
    app.dependency_overrides[get_db] = _override_get_db
    yield
    app.dependency_overrides.clear() # Clear overrides after test

@pytest.fixture(scope="function")
async def client(override_get_db):
    """Provides an async test client for FastAPI."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client

@pytest.fixture(scope="function")
def test_admin_user(db_session):
    """Returns the pre-seeded admin user."""
    return crud_user.get_by_email(db_session, email="admin@example.com")

@pytest.fixture(scope="function")
def test_regular_user(db_session):
    """Returns the pre-seeded regular user."""
    return crud_user.get_by_email(db_session, email="user@example.com")

@pytest.fixture(scope="function")
async def admin_token_headers(client, test_admin_user):
    """Provides authentication headers for the admin user."""
    login_data = {
        "username": "admin@example.com",
        "password": "adminpassword"
    }
    response = await client.post("/api/v1/auth/login", data=login_data)
    assert response.status_code == 200
    tokens = response.json()
    return {"Authorization": f"Bearer {tokens['access_token']}"}

@pytest.fixture(scope="function")
async def regular_user_token_headers(client, test_regular_user):
    """Provides authentication headers for the regular user."""
    login_data = {
        "username": "user@example.com",
        "password": "userpassword"
    }
    response = await client.post("/api/v1/auth/login", data=login_data)
    assert response.status_code == 200
    tokens = response.json()
    return {"Authorization": f"Bearer {tokens['access_token']}"}

@pytest.fixture(scope="function")
def create_test_item(db_session, test_regular_user):
    """Fixture to create an item for a given user."""
    def _create_item(owner_id: int, title: str = "Test Item", description: str = "A test description"):
        item = Item(title=title, description=description, owner_id=owner_id)
        db_session.add(item)
        db_session.commit()
        db_session.refresh(item)
        return item
    return _create_item

@pytest.fixture(scope="function")
def create_another_user(db_session):
    """Fixture to create an additional user."""
    def _create_user(email: str, password: str, role: str = "user", full_name: str = None):
        user_in = UserCreate(email=email, password=password, role=role, full_name=full_name)
        return crud_user.create(db_session, obj_in=user_in)
    return _create_user
```