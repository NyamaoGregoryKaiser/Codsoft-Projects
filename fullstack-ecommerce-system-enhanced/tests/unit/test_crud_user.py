```python
import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from app.crud.crud_user import get_user, get_user_by_email, get_users, create_user, update_user, delete_user
from app.schemas.user import UserCreate, UserUpdate
from app.models.user import User
from app.core.security import verify_password, get_password_hash

@pytest.mark.asyncio
async def test_create_user(db_session: AsyncSession):
    user_in = UserCreate(email="test@example.com", password="password123", first_name="Test", last_name="User", is_admin=False)
    user = await create_user(db_session, user_in)

    assert user.id is not None
    assert user.email == user_in.email
    assert user.first_name == user_in.first_name
    assert user.is_active is True
    assert user.is_admin is False
    assert verify_password(user_in.password, user.hashed_password)

@pytest.mark.asyncio
async def test_get_user(db_session: AsyncSession):
    user_in = UserCreate(email="gettest@example.com", password="password123")
    created_user = await create_user(db_session, user_in)
    
    fetched_user = await get_user(db_session, created_user.id)
    assert fetched_user is not None
    assert fetched_user.email == created_user.email
    assert fetched_user.id == created_user.id

    not_found_user = await get_user(db_session, 9999)
    assert not_found_user is None

@pytest.mark.asyncio
async def test_get_user_by_email(db_session: AsyncSession):
    user_in = UserCreate(email="emailtest@example.com", password="password123")
    created_user = await create_user(db_session, user_in)
    
    fetched_user = await get_user_by_email(db_session, created_user.email)
    assert fetched_user is not None
    assert fetched_user.email == created_user.email

    not_found_user = await get_user_by_email(db_session, "nonexistent@example.com")
    assert not_found_user is None

@pytest.mark.asyncio
async def test_get_users(db_session: AsyncSession):
    await create_user(db_session, UserCreate(email="user1@example.com", password="pass"))
    await create_user(db_session, UserCreate(email="user2@example.com", password="pass"))
    
    users = await get_users(db_session, skip=0, limit=10)
    assert len(users) >= 2 # Could be more if other tests also create users in the same session

    users_limited = await get_users(db_session, skip=0, limit=1)
    assert len(users_limited) == 1

@pytest.mark.asyncio
async def test_update_user(db_session: AsyncSession):
    user_in = UserCreate(email="updatetest@example.com", password="oldpassword")
    user = await create_user(db_session, user_in)

    update_in = UserUpdate(first_name="Updated", email="updated@example.com", password="newpassword")
    updated_user = await update_user(db_session, user, update_in)

    assert updated_user.email == update_in.email
    assert updated_user.first_name == update_in.first_name
    assert verify_password(update_in.password, updated_user.hashed_password)
    assert not verify_password("oldpassword", updated_user.hashed_password)

    # Test partial update
    partial_update_in = UserUpdate(last_name="NewLast")
    partially_updated_user = await update_user(db_session, updated_user, partial_update_in)
    assert partially_updated_user.last_name == "NewLast"
    assert partially_updated_user.email == updated_user.email # Should remain unchanged

@pytest.mark.asyncio
async def test_delete_user(db_session: AsyncSession):
    user_in = UserCreate(email="deletetest@example.com", password="password123")
    user = await create_user(db_session, user_in)

    await delete_user(db_session, user.id)
    
    deleted_user = await get_user(db_session, user.id)
    assert deleted_user is None

    # Test deleting non-existent user
    await delete_user(db_session, 9999) # Should not raise an error
```