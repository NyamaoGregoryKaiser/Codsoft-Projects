```python
import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.crud.user import user as crud_user
from app.schemas.user import UserCreate, UserUpdate
from app.models.user import User
from app.core.security import get_password_hash, verify_password

@pytest.mark.asyncio
async def test_get_user(test_db_session: AsyncSession, create_test_user):
    """
    Test retrieving a user by ID.
    """
    user = await create_test_user(username="testuser1", email="test1@example.com")
    retrieved_user = await crud_user.get(test_db_session, user.id)
    assert retrieved_user.id == user.id
    assert retrieved_user.username == "testuser1"

@pytest.mark.asyncio
async def test_get_nonexistent_user(test_db_session: AsyncSession):
    """
    Test retrieving a user that does not exist.
    """
    retrieved_user = await crud_user.get(test_db_session, 9999)
    assert retrieved_user is None

@pytest.mark.asyncio
async def test_get_by_email(test_db_session: AsyncSession, create_test_user):
    """
    Test retrieving a user by email.
    """
    user = await create_test_user(username="testuser2", email="test2@example.com")
    retrieved_user = await crud_user.get_by_email(test_db_session, email="test2@example.com")
    assert retrieved_user.id == user.id
    assert retrieved_user.email == "test2@example.com"

@pytest.mark.asyncio
async def test_get_by_username(test_db_session: AsyncSession, create_test_user):
    """
    Test retrieving a user by username.
    """
    user = await create_test_user(username="testuser3", email="test3@example.com")
    retrieved_user = await crud_user.get_by_username(test_db_session, username="testuser3")
    assert retrieved_user.id == user.id
    assert retrieved_user.username == "testuser3"

@pytest.mark.asyncio
async def test_create_user_with_hashed_password(test_db_session: AsyncSession):
    """
    Test creating a user with a hashed password.
    """
    user_in = UserCreate(username="newuser", email="newuser@example.com", password="password")
    hashed_password = get_password_hash("password")
    user = await crud_user.create_with_hashed_password(test_db_session, obj_in=user_in, hashed_password=hashed_password)

    assert user.id is not None
    assert user.username == "newuser"
    assert user.email == "newuser@example.com"
    assert verify_password("password", user.hashed_password)
    assert user.is_active is True
    assert user.is_admin is False

@pytest.mark.asyncio
async def test_update_user(test_db_session: AsyncSession, create_test_user):
    """
    Test updating an existing user.
    """
    user = await create_test_user(username="updateuser", email="update@example.com")
    user_update_in = UserUpdate(email="updated@example.com", is_active=False)
    updated_user = await crud_user.update(test_db_session, db_obj=user, obj_in=user_update_in)

    assert updated_user.email == "updated@example.com"
    assert updated_user.is_active is False
    assert updated_user.username == "updateuser" # Username should remain unchanged

@pytest.mark.asyncio
async def test_update_password(test_db_session: AsyncSession, create_test_user):
    """
    Test updating a user's password.
    """
    user = await create_test_user(username="passuser", email="pass@example.com", password="oldpassword")
    new_hashed_password = get_password_hash("newpassword")
    updated_user = await crud_user.update_password(test_db_session, user=user, hashed_password=new_hashed_password)

    assert updated_user.id == user.id
    assert verify_password("newpassword", updated_user.hashed_password)
    assert not verify_password("oldpassword", updated_user.hashed_password)

@pytest.mark.asyncio
async def test_remove_user(test_db_session: AsyncSession, create_test_user):
    """
    Test deleting a user.
    """
    user = await create_test_user(username="deleteuser", email="delete@example.com")
    deleted_user = await crud_user.remove(test_db_session, id=user.id)

    assert deleted_user.id == user.id
    retrieved_user = await crud_user.get(test_db_session, user.id)
    assert retrieved_user is None

@pytest.mark.asyncio
async def test_remove_nonexistent_user(test_db_session: AsyncSession):
    """
    Test deleting a user that does not exist.
    """
    deleted_user = await crud_user.remove(test_db_session, id=9999)
    assert deleted_user is None

@pytest.mark.asyncio
async def test_get_multi_users(test_db_session: AsyncSession, create_test_user):
    """
    Test retrieving multiple users with pagination.
    """
    await create_test_user(username="multiuser1", email="multi1@example.com")
    await create_test_user(username="multiuser2", email="multi2@example.com")
    await create_test_user(username="multiuser3", email="multi3@example.com")

    users_all = await crud_user.get_multi(test_db_session)
    assert len(users_all) == 3

    users_limit_2 = await crud_user.get_multi(test_db_session, limit=2)
    assert len(users_limit_2) == 2

    users_skip_1_limit_1 = await crud_user.get_multi(test_db_session, skip=1, limit=1)
    assert len(users_skip_1_limit_1) == 1
    assert users_skip_1_limit_1[0].username == "multiuser2" # Assuming default order by id or creation
```