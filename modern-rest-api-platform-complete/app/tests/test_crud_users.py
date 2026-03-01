import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from app.crud.user import user as crud_user
from app.schemas.user import UserCreate, UserUpdate
from app.models.user import User
from app.core.security import verify_password

@pytest.mark.asyncio
async def test_create_user(db_session: AsyncSession):
    """Test creating a new user through CRUD operations."""
    user_in = UserCreate(email="test@example.com", password="testpassword")
    user = await crud_user.create(db_session, obj_in=user_in)
    
    assert user.email == "test@example.com"
    assert user.is_active is True
    assert user.is_admin is False
    assert verify_password("testpassword", user.hashed_password)

    # Verify user exists in the database
    retrieved_user = await crud_user.get(db_session, id=user.id)
    assert retrieved_user.email == user.email

@pytest.mark.asyncio
async def test_get_user(db_session: AsyncSession):
    """Test retrieving an existing user by ID."""
    user_in = UserCreate(email="get_test@example.com", password="password123")
    created_user = await crud_user.create(db_session, obj_in=user_in)
    
    user = await crud_user.get(db_session, id=created_user.id)
    assert user is not None
    assert user.email == created_user.email

@pytest.mark.asyncio
async def test_get_user_by_email(db_session: AsyncSession):
    """Test retrieving an existing user by email."""
    user_in = UserCreate(email="email_test@example.com", password="password123")
    created_user = await crud_user.create(db_session, obj_in=user_in)
    
    user = await crud_user.get_by_email(db_session, email="email_test@example.com")
    assert user is not None
    assert user.id == created_user.id

@pytest.mark.asyncio
async def test_update_user(db_session: AsyncSession):
    """Test updating an existing user's details."""
    user_in = UserCreate(email="update_test@example.com", password="oldpassword")
    user = await crud_user.create(db_session, obj_in=user_in)
    
    user_update_in = UserUpdate(email="updated@example.com", password="newpassword", is_active=False)
    updated_user = await crud_user.update(db_session, db_obj=user, obj_in=user_update_in)
    
    assert updated_user.email == "updated@example.com"
    assert updated_user.is_active is False
    assert verify_password("newpassword", updated_user.hashed_password)
    assert not verify_password("oldpassword", updated_user.hashed_password)

    # Verify updates persisted
    retrieved_user = await crud_user.get(db_session, id=user.id)
    assert retrieved_user.email == "updated@example.com"
    assert retrieved_user.is_active is False

@pytest.mark.asyncio
async def test_remove_user(db_session: AsyncSession):
    """Test deleting a user."""
    user_in = UserCreate(email="remove_test@example.com", password="password")
    user = await crud_user.create(db_session, obj_in=user_in)
    
    removed_user = await crud_user.remove(db_session, id=user.id)
    assert removed_user is not None
    assert removed_user.id == user.id

    # Verify user is truly removed
    user_after_remove = await crud_user.get(db_session, id=user.id)
    assert user_after_remove is None
```