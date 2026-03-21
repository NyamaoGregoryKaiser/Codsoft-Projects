import pytest
from app.schemas.user import UserCreate, UserUpdate
from app.crud.user import user as crud_user
from app.core.security import verify_password, get_password_hash
from app.core.exceptions import HTTPException, NotFoundException

@pytest.mark.asyncio
async def test_create_user(db_session):
    user_in = UserCreate(email="test@example.com", password="password123", is_admin=False, is_active=True)
    user = await crud_user.create_user(db_session, user_in)

    assert user.id is not None
    assert user.email == "test@example.com"
    assert verify_password("password123", user.hashed_password)
    assert user.is_active is True
    assert user.is_admin is False

@pytest.mark.asyncio
async def test_get_user(db_session):
    user_in = UserCreate(email="get@example.com", password="password123", is_admin=False, is_active=True)
    created_user = await crud_user.create_user(db_session, user_in)

    fetched_user = await crud_user.get(db_session, created_user.id)
    assert fetched_user.email == created_user.email

    not_found_user = await crud_user.get(db_session, 99999)
    assert not_found_user is None

@pytest.mark.asyncio
async def test_get_user_by_email(db_session):
    user_in = UserCreate(email="getbyemail@example.com", password="password123", is_admin=False, is_active=True)
    created_user = await crud_user.create_user(db_session, user_in)

    fetched_user = await crud_user.get_by_email(db_session, created_user.email)
    assert fetched_user.email == created_user.email

    not_found_user = await crud_user.get_by_email(db_session, "nonexistent@example.com")
    assert not_found_user is None

@pytest.mark.asyncio
async def test_update_user(db_session):
    user_in = UserCreate(email="update@example.com", password="password123", is_admin=False, is_active=True)
    created_user = await crud_user.create_user(db_session, user_in)

    update_schema = UserUpdate(email="updated@example.com", is_active=False, password="newpassword")
    updated_user = await crud_user.update_user(db_session, created_user, update_schema)

    assert updated_user.email == "updated@example.com"
    assert updated_user.is_active is False
    assert verify_password("newpassword", updated_user.hashed_password)
    assert not verify_password("password123", updated_user.hashed_password)

@pytest.mark.asyncio
async def test_delete_user(db_session):
    user_in = UserCreate(email="delete@example.com", password="password123", is_admin=False, is_active=True)
    created_user = await crud_user.create_user(db_session, user_in)

    deleted_user = await crud_user.delete(db_session, created_user.id)
    assert deleted_user.id == created_user.id

    fetched_user = await crud_user.get(db_session, created_user.id)
    assert fetched_user is None

@pytest.mark.asyncio
async def test_get_multi_users(db_session):
    await crud_user.create_user(db_session, UserCreate(email="user1@example.com", password="p1"))
    await crud_user.create_user(db_session, UserCreate(email="user2@example.com", password="p2"))
    await crud_user.create_user(db_session, UserCreate(email="user3@example.com", password="p3"))

    users = await crud_user.get_multi(db_session, skip=0, limit=2)
    assert len(users) == 2
    assert {u.email for u in users} == {"user1@example.com", "user2@example.com"} # Order might not be guaranteed by default

    all_users = await crud_user.get_multi(db_session)
    assert len(all_users) >= 3 # Could be more if other tests leave users