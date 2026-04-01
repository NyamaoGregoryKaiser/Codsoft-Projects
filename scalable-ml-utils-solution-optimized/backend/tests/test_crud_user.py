```python
import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.crud.crud_user import user as crud_user
from backend.app.schemas.user import UserCreate, UserUpdate
from backend.app.models.user import User
from backend.app.auth.security import verify_password

@pytest.mark.asyncio
async def test_create_user(db_session: AsyncSession):
    user_in = UserCreate(username="testuser", email="test@example.com", password="testpassword")
    user = await crud_user.create(db_session, obj_in=user_in)
    assert user.id is not None
    assert user.username == "testuser"
    assert user.email == "test@example.com"
    assert hasattr(user, "hashed_password")
    assert user.is_active is True
    assert user.is_superuser is False
    assert verify_password("testpassword", user.hashed_password)

@pytest.mark.asyncio
async def test_get_user(db_session: AsyncSession):
    user_in = UserCreate(username="getuser", email="get@example.com", password="getpassword")
    created_user = await crud_user.create(db_session, obj_in=user_in)
    
    fetched_user = await crud_user.get(db_session, id=created_user.id)
    assert fetched_user.id == created_user.id
    assert fetched_user.email == created_user.email

@pytest.mark.asyncio
async def test_get_user_by_email(db_session: AsyncSession):
    user_in = UserCreate(username="emailuser", email="email@example.com", password="emailpassword")
    created_user = await crud_user.create(db_session, obj_in=user_in)

    fetched_user = await crud_user.get_by_email(db_session, email="email@example.com")
    assert fetched_user.id == created_user.id
    assert fetched_user.email == "email@example.com"

@pytest.mark.asyncio
async def test_get_user_by_username(db_session: AsyncSession):
    user_in = UserCreate(username="username_test", email="username@example.com", password="usernamepassword")
    created_user = await crud_user.create(db_session, obj_in=user_in)

    fetched_user = await crud_user.get_by_username(db_session, username="username_test")
    assert fetched_user.id == created_user.id
    assert fetched_user.username == "username_test"

@pytest.mark.asyncio
async def test_update_user(db_session: AsyncSession):
    user_in = UserCreate(username="olduser", email="old@example.com", password="oldpassword")
    user = await crud_user.create(db_session, obj_in=user_in)

    user_update_in = UserUpdate(email="new@example.com", password="newpassword")
    updated_user = await crud_user.update(db_session, db_obj=user, obj_in=user_update_in)
    
    assert updated_user.email == "new@example.com"
    assert verify_password("newpassword", updated_user.hashed_password)
    assert updated_user.username == "olduser" # Username should be unchanged

@pytest.mark.asyncio
async def test_delete_user(db_session: AsyncSession):
    user_in = UserCreate(username="deleteuser", email="delete@example.com", password="deletepassword")
    user = await crud_user.create(db_session, obj_in=user_in)
    
    deleted_user = await crud_user.remove(db_session, id=user.id)
    assert deleted_user.id == user.id
    
    fetched_user = await crud_user.get(db_session, id=user.id)
    assert fetched_user is None

@pytest.mark.asyncio
async def test_get_multi_users(db_session: AsyncSession):
    await crud_user.create(db_session, obj_in=UserCreate(username="user1", email="user1@example.com", password="pw1"))
    await crud_user.create(db_session, obj_in=UserCreate(username="user2", email="user2@example.com", password="pw2"))
    await crud_user.create(db_session, obj_in=UserCreate(username="user3", email="user3@example.com", password="pw3"))

    users = await crud_user.get_multi(db_session, skip=0, limit=2)
    assert len(users) == 2
    assert {user.username for user in users} == {"user1", "user2"} # order by id, so first two
```