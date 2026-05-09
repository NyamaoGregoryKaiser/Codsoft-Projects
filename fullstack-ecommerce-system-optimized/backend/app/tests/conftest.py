```python
import os
import sys
import pytest
from typing import Generator, Any
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from fastapi.testclient import TestClient

# Add project root to sys.path to allow imports from app.*
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.main import app
from app.db.base import Base
from app.db.session import get_db
from app.core.config import settings
from app.core import security
from app.db.models import User, Category, Product, Cart, CartItem, Order, OrderItem, Review
from app.schemas.user import UserCreate
from app.crud.user import crud_user
from app.crud.category import crud_category
from app.crud.product import crud_product

# --- Test Database Setup ---
# Use a separate test database
TEST_SQLALCHEMY_DATABASE_URL = settings.SQLALCHEMY_DATABASE_URL.replace(
    f"/{settings.POSTGRES_DB}", f"/{settings.POSTGRES_DB}_test"
)

test_engine = create_engine(TEST_SQLALCHEMY_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

# Override the get_db dependency for tests
@pytest.fixture(scope="function")
def db_session() -> Generator[Session, Any, None]:
    """
    Creates a new database session for each test, rolls back after completion.
    """
    Base.metadata.create_all(bind=test_engine) # Create tables for fresh test DB
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    # Yield the session to the test
    yield session

    # Rollback and close after test
    session.close()
    transaction.rollback()
    connection.close()
    Base.metadata.drop_all(bind=test_engine) # Drop tables to ensure clean state for next test file/run


@pytest.fixture(scope="function")
def client(db_session: Session) -> TestClient:
    """
    Provides a FastAPI test client with an overridden DB dependency.
    """
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    del app.dependency_overrides[get_db]


# --- Helper Fixtures for Test Data ---

@pytest.fixture(scope="function")
def test_user_data() -> UserCreate:
    return UserCreate(email="test@example.com", password="testpassword", full_name="Test User")

@pytest.fixture(scope="function")
def test_user(db_session: Session, test_user_data: UserCreate) -> User:
    user = crud_user.create(db_session, obj_in=test_user_data)
    return user

@pytest.fixture(scope="function")
def superuser_data() -> UserCreate:
    return UserCreate(email=settings.FIRST_SUPERUSER_EMAIL, password=settings.FIRST_SUPERUSER_PASSWORD, full_name="Admin", is_superuser=True)

@pytest.fixture(scope="function")
def superuser(db_session: Session, superuser_data: UserCreate) -> User:
    # Ensure superuser is created with hashed password
    user_in_db = crud_user.get_by_email(db_session, email=superuser_data.email)
    if not user_in_db:
        hashed_password = security.get_password_hash(superuser_data.password)
        user_in_db = User(
            email=superuser_data.email,
            hashed_password=hashed_password,
            full_name=superuser_data.full_name,
            is_active=True,
            is_superuser=True,
        )
        db_session.add(user_in_db)
        db_session.commit()
        db_session.refresh(user_in_db)
    return user_in_db

@pytest.fixture(scope="function")
def superuser_token_headers(client: TestClient, superuser: User) -> dict[str, str]:
    login_data = {
        "username": superuser.email,
        "password": superuser.password, # Note: superuser.password might be None if not directly set
    }
    # Need to get the raw password from settings as it's not stored in model
    login_data['password'] = settings.FIRST_SUPERUSER_PASSWORD

    response = client.post(
        f"{settings.API_V1_STR}/login/access-token", data=login_data
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture(scope="function")
def normal_user_token_headers(client: TestClient, test_user: User) -> dict[str, str]:
    login_data = {
        "username": test_user.email,
        "password": "testpassword",
    }
    response = client.post(
        f"{settings.API_V1_STR}/login/access-token", data=login_data
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture(scope="function")
def test_category(db_session: Session) -> Category:
    category_in = CategoryCreate(name="Electronics", description="Test electronic goods")
    category = crud_category.create(db_session, obj_in=category_in)
    return category

@pytest.fixture(scope="function")
def test_product(db_session: Session, superuser: User, test_category: Category) -> Product:
    product_in = ProductCreate(
        name="Test Product",
        description="A cool test product",
        price=10.00,
        stock=50,
        category_id=test_category.id,
        image_url="http://test.com/img.jpg"
    )
    product = crud_product.create_with_owner(db_session, obj_in=product_in, owner_id=superuser.id)
    return product

```