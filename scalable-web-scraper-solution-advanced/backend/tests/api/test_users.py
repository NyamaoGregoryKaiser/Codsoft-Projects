import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app import crud, schemas
from app.core.config import settings

def test_create_user(client: TestClient, superuser_token_headers: dict, db_session: Session):
    email = "testnewuser@example.com"
    password = "newpassword"
    data = {"email": email, "password": password, "full_name": "New User"}
    response = client.post(f"{settings.API_V1_STR}/users/", headers=superuser_token_headers, json=data)
    assert response.status_code == 200
    created_user = response.json()
    assert created_user["email"] == email
    assert created_user["full_name"] == "New User"
    assert "hashed_password" not in created_user # Should not expose hashed password

    user_in_db = crud.user.get_by_email(db_session, email=email)
    assert user_in_db is not None

def test_create_user_by_normal_user_forbidden(client: TestClient, normal_user_token_headers: dict):
    email = "forbiddenuser@example.com"
    password = "forbiddenpassword"
    data = {"email": email, "password": password}
    response = client.post(f"{settings.API_V1_STR}/users/", headers=normal_user_token_headers, json=data)
    assert response.status_code == 403 # Forbidden

def test_read_users_as_superuser(client: TestClient, superuser_token_headers: dict):
    response = client.get(f"{settings.API_V1_STR}/users/", headers=superuser_token_headers)
    assert response.status_code == 200
    users = response.json()
    assert isinstance(users, list)
    assert len(users) > 0

def test_read_users_as_normal_user_forbidden(client: TestClient, normal_user_token_headers: dict):
    response = client.get(f"{settings.API_V1_STR}/users/", headers=normal_user_token_headers)
    assert response.status_code == 403 # Forbidden

def test_read_user_by_id_as_superuser(client: TestClient, superuser_token_headers: dict, superuser_token_headers_func: dict, db_session: Session):
    # Ensure a superuser exists and retrieve its ID
    admin_user = crud.user.get_by_email(db_session, email=settings.FIRST_SUPERUSER_EMAIL)
    assert admin_user is not None

    response = client.get(f"{settings.API_V1_STR}/users/{admin_user.id}", headers=superuser_token_headers)
    assert response.status_code == 200
    user_data = response.json()
    assert user_data["email"] == settings.FIRST_SUPERUSER_EMAIL

def test_update_user_as_superuser(client: TestClient, superuser_token_headers: dict, db_session: Session):
    user_email = "user_to_update@example.com"
    user_password = "updatepass"
    user_in = schemas.UserCreate(email=user_email, password=user_password, full_name="User To Update")
    user = crud.user.create(db_session, obj_in=user_in)
    
    update_data = {"full_name": "Updated Name", "is_active": False}
    response = client.put(f"{settings.API_V1_STR}/users/{user.id}", headers=superuser_token_headers, json=update_data)
    assert response.status_code == 200
    updated_user = response.json()
    assert updated_user["full_name"] == "Updated Name"
    assert updated_user["is_active"] is False

def test_delete_user_as_superuser(client: TestClient, superuser_token_headers: dict, db_session: Session):
    user_email = "user_to_delete@example.com"
    user_password = "deletepass"
    user_in = schemas.UserCreate(email=user_email, password=user_password, full_name="User To Delete")
    user = crud.user.create(db_session, obj_in=user_in)

    response = client.delete(f"{settings.API_V1_STR}/users/{user.id}", headers=superuser_token_headers)
    assert response.status_code == 200
    deleted_user = response.json()
    assert deleted_user["email"] == user_email
    
    user_in_db = crud.user.get(db_session, id=user.id)
    assert user_in_db is None

def test_delete_superuser_self_forbidden(client: TestClient, superuser_token_headers: dict, db_session: Session):
    admin_user = crud.user.get_by_email(db_session, email=settings.FIRST_SUPERUSER_EMAIL)
    assert admin_user is not None
    
    response = client.delete(f"{settings.API_V1_STR}/users/{admin_user.id}", headers=superuser_token_headers)
    assert response.status_code == 400 # Cannot delete self