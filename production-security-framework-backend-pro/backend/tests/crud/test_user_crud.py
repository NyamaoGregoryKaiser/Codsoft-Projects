```python
import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from app.crud.user import crud_user
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import verify_password
from app.exceptions.custom_exceptions import EntityNotFoundException, ConflictException

@pytest.mark.asyncio
async def test_create_user(db_session: AsyncSession):
    user_in = UserCreate(email="test_new@example.com", password="securepassword123", full_name="New User")
    user = await crud_user.create(db_session, obj_in=user_in)
    assert user.id is not None
    assert user.email == "test_new@example.com"
    assert user.full_name == "New User"
    assert user.role == "user"
    assert user.is_active is True
    assert verify_password("securepassword123", user.hashed_password)

@pytest.mark.asyncio
async def test_get_user(db_session: AsyncSession, test_user):
    user = await crud_user.get(db_session, test_user.id)
    assert user.email == test_user.email

@pytest.mark.asyncio
async def test_get_user_not_found(db_session: AsyncSession):
    user = await crud_user.get(db_session, 9999)
    assert user is None

@pytest.mark.asyncio
async def test_get_user_by_email(db_session: AsyncSession, test_user):
    user = await crud_user.get_by_email(db_session, email=test_user.email)
    assert user.email == test_user.email

@pytest.mark.asyncio
async def test_get_user_by_email_not_found(db_session: AsyncSession):
    user = await crud_user.get_by_email(db_session, email="nonexistent@example.com")
    assert user is None

@pytest.mark.asyncio
async def test_update_user(db_session: AsyncSession, test_user):
    user_update_in = UserUpdate(full_name="Updated Name", is_active=False)
    updated_user = await crud_user.update(db_session, db_obj=test_user, obj_in=user_update_in)
    assert updated_user.full_name == "Updated Name"
    assert updated_user.is_active is False
    assert updated_user.email == test_user.email # Email should not change if not provided
    assert updated_user.updated_at > test_user.updated_at

@pytest.mark.asyncio
async def test_update_user_password(db_session: AsyncSession, test_user):
    user_update_in = UserUpdate(password="newsecurepassword")
    updated_user = await crud_user.update(db_session, db_obj=test_user, obj_in=user_update_in)
    assert verify_password("newsecurepassword", updated_user.hashed_password)
    assert not verify_password("testpassword123", updated_user.hashed_password)

@pytest.mark.asyncio
async def test_remove_user(db_session: AsyncSession, test_user):
    removed_user = await crud_user.remove(db_session, id=test_user.id)
    assert removed_user.id == test_user.id
    
    # Verify user is truly removed
    user = await crud_user.get(db_session, test_user.id)
    assert user is None

@pytest.mark.asyncio
async def test_remove_user_not_found(db_session: AsyncSession):
    removed_user = await crud_user.remove(db_session, id=9999)
    assert removed_user is None
```