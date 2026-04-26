```python
import pytest
from app.crud.user import crud_user
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import verify_password, get_password_hash
from app.core.exceptions import ConflictException

def test_create_user(db_session):
    """Test creating a new user."""
    user_in = UserCreate(email="newuser@example.com", password="testpassword", full_name="New User")
    user = crud_user.create(db_session, obj_in=user_in)

    assert user.id is not None
    assert user.email == "newuser@example.com"
    assert user.full_name == "New User"
    assert user.is_active is True
    assert user.role == "user"
    assert verify_password("testpassword", user.hashed_password)

def test_get_user_by_email(db_session, test_regular_user):
    """Test retrieving a user by email."""
    user = crud_user.get_by_email(db_session, email=test_regular_user.email)
    assert user is not None
    assert user.email == test_regular_user.email

    non_existent_user = crud_user.get_by_email(db_session, email="nonexistent@example.com")
    assert non_existent_user is None

def test_get_user_by_id(db_session, test_admin_user):
    """Test retrieving a user by ID."""
    user = crud_user.get_by_id(db_session, id=test_admin_user.id)
    assert user is not None
    assert user.id == test_admin_user.id

    non_existent_user = crud_user.get_by_id(db_session, id=999)
    assert non_existent_user is None

def test_update_user(db_session, test_regular_user):
    """Test updating an existing user."""
    user_update_in = UserUpdate(full_name="Updated Name", password="newpassword123")
    updated_user = crud_user.update(db_session, db_obj=test_regular_user, obj_in=user_update_in)

    assert updated_user.full_name == "Updated Name"
    assert verify_password("newpassword123", updated_user.hashed_password)
    assert updated_user.email == test_regular_user.email # Email should not change

    # Test updating only one field
    user_update_in_partial = UserUpdate(is_active=False)
    updated_user_partial = crud_user.update(db_session, db_obj=updated_user, obj_in=user_update_in_partial)
    assert updated_user_partial.is_active is False
    assert updated_user_partial.full_name == "Updated Name" # Should remain unchanged

def test_update_user_role_and_active_status(db_session, test_regular_user):
    """Test updating user's role and active status (typically by admin)."""
    user_update_in = UserUpdate(role="admin", is_active=False)
    updated_user = crud_user.update(db_session, db_obj=test_regular_user, obj_in=user_update_in)

    assert updated_user.role == "admin"
    assert updated_user.is_active is False

def test_delete_user(db_session, create_another_user):
    """Test deleting a user."""
    user_to_delete = create_another_user(email="delete@example.com", password="password")
    deleted_user = crud_user.remove(db_session, id=user_to_delete.id)

    assert deleted_user.id == user_to_delete.id
    assert crud_user.get_by_id(db_session, id=user_to_delete.id) is None
```