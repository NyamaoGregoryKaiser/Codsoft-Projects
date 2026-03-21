```python
import pytest
from unittest.mock import MagicMock
from sqlalchemy.orm import Session
from backend.services.auth_service import AuthService
from backend.schemas.user import UserCreate
from backend.schemas.auth import LoginRequest
from backend.models import User as DBUser
from backend.core.exception_handlers import UserAlreadyExistsError, UnauthorizedAccessError
from backend.core.security import get_password_hash, verify_password

@pytest.fixture
def auth_service():
    return AuthService()

@pytest.fixture
def mock_db_session():
    return MagicMock(spec=Session)

def test_register_user_success(auth_service: AuthService, mock_db_session: Session):
    # Mock query to return None (user does not exist)
    mock_db_session.query.return_value.filter.return_value.first.return_value = None

    user_data = UserCreate(email="newuser@test.com", password="testpassword123")
    registered_user = auth_service.register_user(mock_db_session, user_data)

    assert registered_user.email == user_data.email
    assert verify_password(user_data.password, registered_user.hashed_password)
    mock_db_session.add.assert_called_once()
    mock_db_session.commit.assert_called_once()
    mock_db_session.refresh.assert_called_once_with(registered_user)

def test_register_user_already_exists(auth_service: AuthService, mock_db_session: Session):
    # Mock query to return an existing user
    mock_db_session.query.return_value.filter.return_value.first.return_value = DBUser(email="existing@test.com")

    user_data = UserCreate(email="existing@test.com", password="testpassword123")
    with pytest.raises(UserAlreadyExistsError):
        auth_service.register_user(mock_db_session, user_data)
    mock_db_session.add.assert_not_called()
    mock_db_session.commit.assert_not_called()

def test_authenticate_user_success(auth_service: AuthService, mock_db_session: Session):
    test_email = "test@auth.com"
    test_password = "validpassword"
    hashed_pass = get_password_hash(test_password)
    mock_user = DBUser(email=test_email, hashed_password=hashed_pass, is_active=True)

    # Mock query to return the user
    mock_db_session.query.return_value.filter.return_value.first.return_value = mock_user

    login_data = LoginRequest(email=test_email, password=test_password)
    authenticated_user = auth_service.authenticate_user(mock_db_session, login_data)

    assert authenticated_user.email == test_email
    assert authenticated_user.is_active is True

def test_authenticate_user_invalid_credentials(auth_service: AuthService, mock_db_session: Session):
    test_email = "test@auth.com"
    test_password = "validpassword"
    hashed_pass = get_password_hash(test_password)
    mock_user = DBUser(email=test_email, hashed_password=hashed_pass, is_active=True)

    # Mock query to return the user
    mock_db_session.query.return_value.filter.return_value.first.return_value = mock_user

    login_data = LoginRequest(email=test_email, password="wrongpassword")
    with pytest.raises(UnauthorizedAccessError, match="Incorrect email or password"):
        auth_service.authenticate_user(mock_db_session, login_data)

def test_authenticate_user_not_found(auth_service: AuthService, mock_db_session: Session):
    # Mock query to return None (user not found)
    mock_db_session.query.return_value.filter.return_value.first.return_value = None

    login_data = LoginRequest(email="nonexistent@test.com", password="anypassword")
    with pytest.raises(UnauthorizedAccessError, match="Incorrect email or password"):
        auth_service.authenticate_user(mock_db_session, login_data)

def test_authenticate_user_inactive(auth_service: AuthService, mock_db_session: Session):
    test_email = "inactive@auth.com"
    test_password = "validpassword"
    hashed_pass = get_password_hash(test_password)
    mock_user = DBUser(email=test_email, hashed_password=hashed_pass, is_active=False)

    # Mock query to return the inactive user
    mock_db_session.query.return_value.filter.return_value.first.return_value = mock_user

    login_data = LoginRequest(email=test_email, password=test_password)
    with pytest.raises(UnauthorizedAccessError, match="Inactive user"):
        auth_service.authenticate_user(mock_db_session, login_data)

def test_create_token_for_user(auth_service: AuthService):
    test_user = DBUser(email="token@test.com", is_active=True)
    token_obj = auth_service.create_token_for_user(test_user)
    assert token_obj.access_token is not None
    assert token_obj.token_type == "bearer"
```