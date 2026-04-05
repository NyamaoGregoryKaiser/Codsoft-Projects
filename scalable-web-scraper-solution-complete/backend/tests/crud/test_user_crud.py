import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from app.crud.user import user as crud_user
from app.schemas.user import UserCreate, UserUpdate
from app.models.user import UserRole
from app.core.security import verify_password, get_password_hash

@pytest.mark.asyncio
async def test_create_user(db_session: AsyncSession):
    user_in = UserCreate(email="test@example.com", password="securepassword123")
    user = await crud_user.create(db_session, obj_in=user_in)
    assert user.email == "test@example.com"
    assert verify_password("securepassword123", user.hashed_password)
    assert user.is_active is True
    assert user.role == UserRole.USER

@pytest.mark.asyncio
async def test_get_user(db_session: AsyncSession):
    user_in = UserCreate(email="get@example.com", password="password")
    created_user = await crud_user.create(db_session, obj_in=user_in)
    retrieved_user = await crud_user.get(db_session, id=created_user.id)
    assert retrieved_user.email == "get@example.com"

@pytest.mark.asyncio
async def test_get_user_by_email(db_session: AsyncSession):
    user_in = UserCreate(email="getbyemail@example.com", password="password")
    await crud_user.create(db_session, obj_in=user_in)
    retrieved_user = await crud_user.get_by_email(db_session, email="getbyemail@example.com")
    assert retrieved_user.email == "getbyemail@example.com"

@pytest.mark.asyncio
async def test_update_user(db_session: AsyncSession):
    user_in = UserCreate(email="update@example.com", password="oldpassword")
    user = await crud_user.create(db_session, obj_in=user_in)
    
    user_update_in = UserUpdate(email="updated@example.com", password="newpassword", is_active=False)
    updated_user = await crud_user.update(db_session, db_obj=user, obj_in=user_update_in)
    
    assert updated_user.email == "updated@example.com"
    assert updated_user.is_active is False
    assert verify_password("newpassword", updated_user.hashed_password) # Check new password
    
    # Ensure old password doesn't work
    assert not verify_password("oldpassword", updated_user.hashed_password)

@pytest.mark.asyncio
async def test_delete_user(db_session: AsyncSession):
    user_in = UserCreate(email="delete@example.com", password="password")
    user = await crud_user.create(db_session, obj_in=user_in)
    
    deleted_user = await crud_user.delete(db_session, id=user.id)
    assert deleted_user.id == user.id
    
    retrieved_user = await crud_user.get(db_session, id=user.id)
    assert retrieved_user is None

@pytest.mark.asyncio
async def test_get_admins(db_session: AsyncSession):
    await crud_user.create(db_session, obj_in=UserCreate(email="user1@example.com", password="pass"))
    admin1 = await crud_user.create(db_session, obj_in=UserCreate(email="admin1@example.com", password="pass", role=UserRole.ADMIN))
    admin2 = await crud_user.create(db_session, obj_in=UserCreate(email="admin2@example.com", password="pass", role=UserRole.ADMIN))

    admins = await crud_user.get_admins(db_session)
    assert len(admins) == 2
    assert admin1 in admins
    assert admin2 in admins
    assert all(user.role == UserRole.ADMIN for user in admins)
```