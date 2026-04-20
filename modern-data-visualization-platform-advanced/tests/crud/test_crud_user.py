import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from app.crud.user import user as crud_user
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import verify_password, get_password_hash
from app.core.exceptions import HTTPException
from app.models.user import User

pytestmark = pytest.mark.asyncio

async def test_create_user(db_session: AsyncSession):
    user_in = UserCreate(email="crudtest@example.com", password="crudpassword")
    user = await crud_user.create(db_session, obj_in=user_in)

    assert user.email == "crudtest@example.com"
    assert verify_password("crudpassword", user.hashed_password)
    assert user.is_active is True
    assert user.is_superuser is False
    assert user.id is not None

    fetched_user = await crud_user.get(db_session, user.id)
    assert fetched_user.email == user.email

async def test_get_user_by_email(db_session: AsyncSession):
    email = "emailget@example.com"
    hashed_password = get_password_hash("password")
    new_user = User(email=email, hashed_password=hashed_password)
    db_session.add(new_user)
    await db_session.commit()
    await db_session.refresh(new_user)

    fetched_user = await crud_user.get_by_email(db_session, email=email)
    assert fetched_user.email == email
    assert fetched_user.id == new_user.id

    not_found_user = await crud_user.get_by_email(db_session, email="nonexistent@example.com")
    assert not_found_user is None

async def test_update_user(db_session: AsyncSession):
    user_in = UserCreate(email="update@example.com", password="oldpassword")
    user = await crud_user.create(db_session, obj_in=user_in)

    user_update = UserUpdate(email="updated@example.com", password="newpassword", is_active=False)
    updated_user = await crud_user.update(db_session, db_obj=user, obj_in=user_update)

    assert updated_user.email == "updated@example.com"
    assert verify_password("newpassword", updated_user.hashed_password)
    assert updated_user.is_active is False

    # Partial update
    user_update_partial = UserUpdate(is_superuser=True)
    updated_user_partial = await crud_user.update(db_session, db_obj=updated_user, obj_in=user_update_partial)
    assert updated_user_partial.is_superuser is True
    assert updated_user_partial.email == "updated@example.com" # Should not change
    assert updated_user_partial.is_active is False # Should not change

async def test_delete_user(db_session: AsyncSession):
    user_in = UserCreate(email="delete@example.com", password="password")
    user = await crud_user.create(db_session, obj_in=user_in)

    deleted_user = await crud_user.delete(db_session, id=user.id)
    assert deleted_user.id == user.id

    fetched_user = await crud_user.get(db_session, user.id)
    assert fetched_user is None

    non_existent_delete = await crud_user.delete(db_session, id=999)
    assert non_existent_delete is None