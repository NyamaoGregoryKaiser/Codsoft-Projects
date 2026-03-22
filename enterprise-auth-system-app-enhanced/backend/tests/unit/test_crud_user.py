import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from app.crud.crud_user import CRUDUser
from app.schemas.user import UserCreate, UserUpdate
from app.models.user import User
from app.core.security import verify_password, get_password_hash
from faker import Faker

fake = Faker()
crud_user = CRUDUser(User)

@pytest.mark.asyncio
async def test_create_user(db_session: AsyncSession):
    email = fake.email()
    password = fake.password()
    user_in = UserCreate(email=email, password=password, first_name=fake.first_name())
    user = await crud_user.create(db_session, obj_in=user_in)

    assert user.email == email
    assert verify_password(password, user.hashed_password)
    assert user.is_active is True
    assert user.is_superuser is False
    assert user.is_verified is False
    assert user.id is not None

@pytest.mark.asyncio
async def test_get_user(db_session: AsyncSession):
    email = fake.email()
    password = fake.password()
    user_in = UserCreate(email=email, password=password)
    created_user = await crud_user.create(db_session, obj_in=user_in)

    fetched_user = await crud_user.get(db_session, id=created_user.id)
    assert fetched_user is not None
    assert fetched_user.email == email

@pytest.mark.asyncio
async def test_get_user_by_email(db_session: AsyncSession):
    email = fake.email()
    password = fake.password()
    user_in = UserCreate(email=email, password=password)
    created_user = await crud_user.create(db_session, obj_in=user_in)

    fetched_user = await crud_user.get_by_email(db_session, email=email)
    assert fetched_user is not None
    assert fetched_user.id == created_user.id

@pytest.mark.asyncio
async def test_update_user(db_session: AsyncSession):
    email = fake.email()
    password = fake.password()
    user_in = UserCreate(email=email, password=password, first_name="Old Name")
    user = await crud_user.create(db_session, obj_in=user_in)

    new_email = fake.email()
    new_first_name = "New Name"
    user_update = UserUpdate(email=new_email, first_name=new_first_name)
    updated_user = await crud_user.update(db_session, db_obj=user, obj_in=user_update)

    assert updated_user.email == new_email
    assert updated_user.first_name == new_first_name
    assert updated_user.id == user.id

@pytest.mark.asyncio
async def test_update_user_password(db_session: AsyncSession):
    email = fake.email()
    old_password = fake.password()
    user_in = UserCreate(email=email, password=old_password)
    user = await crud_user.create(db_session, obj_in=user_in)

    new_password = fake.password()
    user_update = UserUpdate(password=new_password)
    updated_user = await crud_user.update(db_session, db_obj=user, obj_in=user_update)

    assert verify_password(new_password, updated_user.hashed_password)
    assert not verify_password(old_password, updated_user.hashed_password)

@pytest.mark.asyncio
async def test_remove_user(db_session: AsyncSession):
    email = fake.email()
    password = fake.password()
    user_in = UserCreate(email=email, password=password)
    user = await crud_user.create(db_session, obj_in=user_in)

    removed_user = await crud_user.remove(db_session, id=user.id)
    assert removed_user is not None
    assert removed_user.id == user.id

    fetched_user = await crud_user.get(db_session, id=user.id)
    assert fetched_user is None

@pytest.mark.asyncio
async def test_authenticate_user(db_session: AsyncSession):
    email = fake.email()
    password = fake.password()
    user_in = UserCreate(email=email, password=password)
    user = await crud_user.create(db_session, obj_in=user_in)

    authenticated_user = await crud_user.authenticate(db_session, email=email, password=password)
    assert authenticated_user is not None
    assert authenticated_user.id == user.id

    failed_auth = await crud_user.authenticate(db_session, email=email, password="wrong_password")
    assert failed_auth is None

    failed_auth_email = await crud_user.authenticate(db_session, email="nonexistent@example.com", password=password)
    assert failed_auth_email is None

@pytest.mark.asyncio
async def test_set_password(db_session: AsyncSession):
    email = fake.email()
    old_password = fake.password()
    user_in = UserCreate(email=email, password=old_password)
    user = await crud_user.create(db_session, obj_in=user_in)

    new_password = fake.password()
    updated_user = await crud_user.set_password(db_session, user=user, new_password=new_password)

    assert verify_password(new_password, updated_user.hashed_password)
    assert not verify_password(old_password, updated_user.hashed_password)
    assert updated_user.id == user.id

@pytest.mark.asyncio
async def test_mark_as_verified(db_session: AsyncSession):
    email = fake.email()
    password = fake.password()
    user_in = UserCreate(email=email, password=password, is_verified=False)
    user = await crud_user.create(db_session, obj_in=user_in)

    assert user.is_verified is False
    verified_user = await crud_user.mark_as_verified(db_session, user=user)
    assert verified_user.is_verified is True
    assert verified_user.id == user.id

```