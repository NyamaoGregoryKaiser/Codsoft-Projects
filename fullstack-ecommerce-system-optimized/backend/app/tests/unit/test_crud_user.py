```python
import pytest
from sqlalchemy.orm import Session

from app.crud.user import crud_user
from app.schemas.user import UserCreate, UserUpdate
from app.core import security
from app.db.models import User # For type hinting

def test_create_user(db_session: Session, test_user_data: UserCreate):
    user = crud_user.create(db_session, obj_in=test_user_data)
    assert user.email == test_user_data.email
    assert hasattr(user, "hashed_password")
    assert user.is_active is True
    assert user.is_superuser is False
    assert security.verify_password(test_user_data.password, user.hashed_password)

def test_get_user(db_session: Session, test_user: User):
    retrieved_user = crud_user.get(db_session, id=test_user.id)
    assert retrieved_user.email == test_user.email

def test_get_user_by_email(db_session: Session, test_user: User):
    retrieved_user = crud_user.get_by_email(db_session, email=test_user.email)
    assert retrieved_user.id == test_user.id

def test_authenticate_user(db_session: Session, test_user: User):
    authenticated_user = crud_user.authenticate(db_session, email=test_user.email, password="testpassword")
    assert authenticated_user.id == test_user.id

def test_authenticate_user_wrong_password(db_session: Session, test_user: User):
    authenticated_user = crud_user.authenticate(db_session, email=test_user.email, password="wrongpassword")
    assert authenticated_user is None

def test_authenticate_user_non_existent(db_session: Session):
    authenticated_user = crud_user.authenticate(db_session, email="nonexistent@example.com", password="password")
    assert authenticated_user is None

def test_update_user(db_session: Session, test_user: User):
    new_full_name = "Updated User"
    user_update = UserUpdate(full_name=new_full_name)
    updated_user = crud_user.update(db_session, db_obj=test_user, obj_in=user_update)
    assert updated_user.full_name == new_full_name

def test_update_user_password(db_session: Session, test_user: User):
    new_password = "newtestpassword"
    user_update = UserUpdate(password=new_password)
    updated_user = crud_user.update(db_session, db_obj=test_user, obj_in=user_update)
    assert security.verify_password(new_password, updated_user.hashed_password)

def test_remove_user(db_session: Session, test_user: User):
    removed_user = crud_user.remove(db_session, id=test_user.id)
    assert removed_user.id == test_user.id
    assert crud_user.get(db_session, id=test_user.id) is None

def test_is_active(db_session: Session, test_user: User):
    assert crud_user.is_active(test_user) is True
    test_user.is_active = False
    db_session.add(test_user)
    db_session.commit()
    assert crud_user.is_active(test_user) is False

def test_is_superuser(db_session: Session, superuser: User, test_user: User):
    assert crud_user.is_superuser(superuser) is True
    assert crud_user.is_superuser(test_user) is False

```