import pytest
from sqlalchemy.orm import Session

from app import crud, schemas
from app.core.security import verify_password, get_password_hash

def test_get_user(db_session: Session):
    email = "testget@example.com"
    password = "testpassword"
    user_in = schemas.UserCreate(email=email, password=password)
    user = crud.user.create(db_session, obj_in=user_in)
    
    retrieved_user = crud.user.get(db_session, user.id)
    assert retrieved_user is not None
    assert retrieved_user.email == email

def test_get_user_by_email(db_session: Session):
    email = "testgetbyemail@example.com"
    password = "testpassword"
    user_in = schemas.UserCreate(email=email, password=password)
    crud.user.create(db_session, obj_in=user_in)
    
    retrieved_user = crud.user.get_by_email(db_session, email=email)
    assert retrieved_user is not None
    assert retrieved_user.email == email

def test_create_user_crud(db_session: Session):
    email = "testcreate@example.com"
    password = "testpassword"
    user_in = schemas.UserCreate(email=email, password=password, full_name="Test User")
    user = crud.user.create(db_session, obj_in=user_in)
    
    assert user.email == email
    assert user.full_name == "Test User"
    assert hasattr(user, "hashed_password")
    assert verify_password(password, user.hashed_password)
    assert user.is_active is True
    assert user.is_superuser is False

def test_update_user_crud(db_session: Session):
    email = "testupdate@example.com"
    password = "testpassword"
    user_in = schemas.UserCreate(email=email, password=password)
    user = crud.user.create(db_session, obj_in=user_in)
    
    new_password = "newtestpassword"
    user_update_in = schemas.UserUpdate(full_name="Updated Name", password=new_password, is_active=False)
    updated_user = crud.user.update(db_session, db_obj=user, obj_in=user_update_in)
    
    assert updated_user.full_name == "Updated Name"
    assert updated_user.is_active is False
    assert verify_password(new_password, updated_user.hashed_password)
    assert not verify_password(password, updated_user.hashed_password) # Old password should no longer work

def test_remove_user_crud(db_session: Session):
    email = "testremove@example.com"
    password = "testpassword"
    user_in = schemas.UserCreate(email=email, password=password)
    user = crud.user.create(db_session, obj_in=user_in)
    
    removed_user = crud.user.remove(db_session, id=user.id)
    assert removed_user is not None
    assert removed_user.email == email
    
    retrieved_user = crud.user.get(db_session, user.id)
    assert retrieved_user is None

def test_is_superuser(db_session: Session):
    user_normal_in = schemas.UserCreate(email="normal@example.com", password="password")
    user_normal = crud.user.create(db_session, obj_in=user_normal_in)
    assert not crud.user.is_superuser(user_normal)

    user_superuser_in = schemas.UserCreate(email="super@example.com", password="password", is_superuser=True)
    user_superuser = crud.user.create(db_session, obj_in=user_superuser_in)
    assert crud.user.is_superuser(user_superuser)