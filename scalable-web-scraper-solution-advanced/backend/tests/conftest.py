import asyncio
from typing import Generator, Any

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from redis.asyncio import Redis

from app.db.base_class import Base
from app.db.session import get_db, SessionLocal
from app.main import app
from app.core.config import settings
from app.core.security import get_password_hash
from app import crud, schemas, models
from app.api.deps import get_redis_client

# Override settings for tests to use a test database
TEST_DATABASE_URL = "postgresql+psycopg2://test_user:test_password@db:5432/test_db"
settings.DATABASE_URL = TEST_DATABASE_URL
settings.FIRST_SUPERUSER_EMAIL = "testadmin@example.com"
settings.FIRST_SUPERUSER_PASSWORD = "testpassword"
settings.SECRET_KEY = "test_secret_key_for_jwt" # Use a consistent test key
settings.ACCESS_TOKEN_EXPIRE_MINUTES = 60 # Extend token expiration for tests

# Create a synchronous test engine
engine = create_engine(TEST_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    # Create tables
    Base.metadata.create_all(bind=engine)
    yield
    # Drop tables after tests
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def db_session() -> Generator[Session, Any, None]:
    """
    Creates a new database session for each test, rolls back after.
    """
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    # Override the app's get_db dependency to use the test session
    app.dependency_overrides[get_db] = lambda: session

    yield session

    session.close()
    transaction.rollback()
    connection.close()
    app.dependency_overrides = {} # Clear overrides

@pytest.fixture(scope="function")
async def redis_client() -> Generator[Redis, Any, None]:
    """
    Provides a Redis client for tests, ensures it's clean.
    """
    _redis = await get_redis_client().__anext__() # Get actual Redis client from generator
    await _redis.flushdb() # Clear DB for fresh state
    yield _redis
    await _redis.flushdb()
    await _redis.close()

@pytest.fixture(scope="module")
def client() -> TestClient:
    """
    A synchronous TestClient for the FastAPI app.
    """
    return TestClient(app)

@pytest.fixture(scope="function")
def superuser_token_headers(client: TestClient, db_session: Session) -> dict[str, str]:
    """
    Returns headers with a valid JWT token for a superuser.
    Creates a superuser if one doesn't exist.
    """
    user = crud.user.get_by_email(db_session, email=settings.FIRST_SUPERUSER_EMAIL)
    if not user:
        user_in = schemas.UserCreate(
            email=settings.FIRST_SUPERUSER_EMAIL,
            password=settings.FIRST_SUPERUSER_PASSWORD,
            is_superuser=True,
        )
        user = crud.user.create(db_session, obj_in=user_in)

    login_data = {
        "username": settings.FIRST_SUPERUSER_EMAIL,
        "password": settings.FIRST_SUPERUSER_PASSWORD,
    }
    r = client.post(f"{settings.API_V1_STR}/auth/login", data=login_data)
    response_data = r.json()
    assert r.status_code == 200
    token = response_data["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture(scope="function")
def normal_user_token_headers(client: TestClient, db_session: Session) -> dict[str, str]:
    """
    Returns headers with a valid JWT token for a regular user.
    Creates a regular user if one doesn't exist.
    """
    user_email = "testuser@example.com"
    user_password = "testpassword"
    user = crud.user.get_by_email(db_session, email=user_email)
    if not user:
        user_in = schemas.UserCreate(
            email=user_email,
            password=user_password,
            is_superuser=False,
            full_name="Test User"
        )
        user = crud.user.create(db_session, obj_in=user_in)

    login_data = {
        "username": user_email,
        "password": user_password,
    }
    r = client.post(f"{settings.API_V1_STR}/auth/login", data=login_data)
    response_data = r.json()
    assert r.status_code == 200
    token = response_data["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture(scope="function")
def normal_user(db_session: Session) -> models.User:
    """
    Creates and returns a normal user object.
    """
    user_email = "testuser_obj@example.com"
    user_password = "testpassword"
    user = crud.user.get_by_email(db_session, email=user_email)
    if not user:
        user_in = schemas.UserCreate(
            email=user_email,
            password=user_password,
            is_superuser=False,
            full_name="Test User Obj"
        )
        user = crud.user.create(db_session, obj_in=user_in)
    return user

@pytest.fixture(scope="function")
def superuser(db_session: Session) -> models.User:
    """
    Creates and returns a superuser object.
    """
    user = crud.user.get_by_email(db_session, email=settings.FIRST_SUPERUSER_EMAIL)
    if not user:
        user_in = schemas.UserCreate(
            email=settings.FIRST_SUPERUSER_EMAIL,
            password=settings.FIRST_SUPERUSER_PASSWORD,
            is_superuser=True,
            full_name="Test Admin"
        )
        user = crud.user.create(db_session, obj_in=user_in)
    return user