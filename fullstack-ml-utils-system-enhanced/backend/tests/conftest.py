```python
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

from backend.main import app
from backend.database import get_db, Base
from backend.models import User
from backend.core.config import settings
from backend.core.security import get_password_hash
from backend.services.cache_service import cache_service # Import to clear cache for tests

# Use an in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool, # Important for SQLite in-memory, to prevent connection closure
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(name="db_session")
def db_session_fixture():
    # Create the database tables
    Base.metadata.create_all(bind=engine)
    # Get a new session
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        # Drop all tables after the test to ensure a clean slate
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(name="client")
def client_fixture(db_session: Session):
    # Override the get_db dependency to use the test database session
    def override_get_db():
        try:
            yield db_session
        finally:
            db_session.close() # No need to close if session is managed by fixture

    app.dependency_overrides[get_db] = override_get_db
    # Clear cache before each test
    cache_service.clear_all()
    with TestClient(app) as client:
        yield client
    # Clean up dependency override
    app.dependency_overrides = {}

@pytest.fixture(name="test_user")
def test_user_fixture(db_session: Session):
    hashed_password = get_password_hash("testpassword")
    user = User(
        email="test@example.com",
        hashed_password=hashed_password,
        is_active=True,
        is_superuser=False
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture(name="test_superuser")
def test_superuser_fixture(db_session: Session):
    hashed_password = get_password_hash("superpassword")
    superuser = User(
        email="super@example.com",
        hashed_password=hashed_password,
        is_active=True,
        is_superuser=True
    )
    db_session.add(superuser)
    db_session.commit()
    db_session.refresh(superuser)
    return superuser

@pytest.fixture(name="auth_token")
def auth_token_fixture(client: TestClient, test_user: User):
    login_data = {"username": test_user.email, "password": "testpassword"}
    response = client.post(f"{settings.API_V1_STR}/auth/token", data=login_data)
    assert response.status_code == 200
    return response.json()["access_token"]

@pytest.fixture(name="superuser_auth_token")
def superuser_auth_token_fixture(client: TestClient, test_superuser: User):
    login_data = {"username": test_superuser.email, "password": "superpassword"}
    response = client.post(f"{settings.API_V1_STR}/auth/token", data=login_data)
    assert response.status_code == 200
    return response.json()["access_token"]

```