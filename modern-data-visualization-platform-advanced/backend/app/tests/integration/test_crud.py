```python
import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from app.crud.users import crud_user
from app.schemas.user import UserCreate, UserUpdate
from app.models.user import User
from app.core.security import verify_password, get_password_hash

@pytest.mark.asyncio
async def test_create_user(db_session: AsyncSession):
    user_in = UserCreate(email="test@example.com", password="SecurePassword123", full_name="Test User")
    user = await crud_user.create(db_session, obj_in=user_in)

    assert user.id is not None
    assert user.email == "test@example.com"
    assert user.full_name == "Test User"
    assert user.is_active is True
    assert user.is_superuser is False
    assert verify_password("SecurePassword123", user.hashed_password)

@pytest.mark.asyncio
async def test_get_user(db_session: AsyncSession):
    user_in = UserCreate(email="get@example.com", password="Password123")
    created_user = await crud_user.create(db_session, obj_in=user_in)

    fetched_user = await crud_user.get(db_session, id=created_user.id)
    assert fetched_user is not None
    assert fetched_user.email == "get@example.com"
    assert fetched_user.id == created_user.id

    not_found_user = await crud_user.get(db_session, id=9999)
    assert not_found_user is None

@pytest.mark.asyncio
async def test_get_user_by_email(db_session: AsyncSession):
    user_in = UserCreate(email="email@example.com", password="Password123")
    created_user = await crud_user.create(db_session, obj_in=user_in)

    fetched_user = await crud_user.get_by_email(db_session, email="email@example.com")
    assert fetched_user is not None
    assert fetched_user.email == "email@example.com"

    not_found_user = await crud_user.get_by_email(db_session, email="nonexistent@example.com")
    assert not_found_user is None

@pytest.mark.asyncio
async def test_update_user(db_session: AsyncSession):
    user_in = UserCreate(email="update@example.com", password="OldPassword")
    user = await crud_user.create(db_session, obj_in=user_in)

    user_update_in = UserUpdate(email="updated@example.com", full_name="Updated Name", password="NewPassword")
    updated_user = await crud_user.update(db_session, db_obj=user, obj_in=user_update_in)

    assert updated_user.email == "updated@example.com"
    assert updated_user.full_name == "Updated Name"
    assert verify_password("NewPassword", updated_user.hashed_password)
    assert not verify_password("OldPassword", updated_user.hashed_password) # Old password should no longer work

    # Update without password
    user_update_in_partial = UserUpdate(full_name="Partial Update")
    partially_updated_user = await crud_user.update(db_session, db_obj=updated_user, obj_in=user_update_in_partial)
    assert partially_updated_user.full_name == "Partial Update"
    assert partially_updated_user.email == "updated@example.com" # Email should remain unchanged
    assert verify_password("NewPassword", partially_updated_user.hashed_password) # Password should remain unchanged

@pytest.mark.asyncio
async def test_delete_user(db_session: AsyncSession):
    user_in = UserCreate(email="delete@example.com", password="DeleteMe")
    user = await crud_user.create(db_session, obj_in=user_in)

    removed_user = await crud_user.remove(db_session, id=user.id)
    assert removed_user is not None
    assert removed_user.id == user.id

    fetched_user = await crud_user.get(db_session, id=user.id)
    assert fetched_user is None

    # Try to remove non-existent user
    non_existent_removed = await crud_user.remove(db_session, id=9999)
    assert non_existent_removed is None

@pytest.mark.asyncio
async def test_get_multi_users(db_session: AsyncSession):
    # Ensure there are users in the db for the test
    await crud_user.create(db_session, obj_in=UserCreate(email="multi1@example.com", password="P1"))
    await crud_user.create(db_session, obj_in=UserCreate(email="multi2@example.com", password="P2"))
    await crud_user.create(db_session, obj_in=UserCreate(email="multi3@example.com", password="P3"))

    users = await crud_user.get_multi(db_session, skip=0, limit=2)
    assert len(users) == 2
    assert {u.email for u in users} == {"multi1@example.com", "multi2@example.com"}

    users_page_2 = await crud_user.get_multi(db_session, skip=2, limit=2)
    assert len(users_page_2) == 1
    assert {u.email for u in users_page_2} == {"multi3@example.com"}

```