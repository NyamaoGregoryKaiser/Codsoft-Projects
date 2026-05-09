```python
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.models import User
from app.schemas.user import UserCreate, UserUpdate
from app.crud.user import crud_user

def test_read_users_superuser(client: TestClient, superuser_token_headers: dict, test_user: User):
    response = client.get(
        f"{settings.API_V1_STR}/users/", headers=superuser_token_headers
    )
    assert response.status_code == 200
    users = response.json()
    assert isinstance(users, list)
    assert any(user["email"] == test_user.email for user in users)
    assert any(user["email"] == settings.FIRST_SUPERUSER_EMAIL for user in users)

def test_read_users_normal_user_forbidden(client: TestClient, normal_user_token_headers: dict):
    response = client.get(
        f"{settings.API_V1_STR}/users/", headers=normal_user_token_headers
    )
    assert response.status_code == 403

def test_read_user_me(client: TestClient, normal_user_token_headers: dict, test_user: User):
    response = client.get(
        f"{settings.API_V1_STR}/users/me", headers=normal_user_token_headers
    )
    assert response.status_code == 200
    user_me = response.json()
    assert user_me["email"] == test_user.email
    assert user_me["id"] == test_user.id

def test_read_user_by_id_superuser(client: TestClient, superuser_token_headers: dict, test_user: User):
    response = client.get(
        f"{settings.API_V1_STR}/users/{test_user.id}", headers=superuser_token_headers
    )
    assert response.status_code == 200
    user_data = response.json()
    assert user_data["email"] == test_user.email
    assert user_data["id"] == test_user.id

def test_read_user_by_id_normal_user_forbidden(client: TestClient, normal_user_token_headers: dict, superuser: User):
    response = client.get(
        f"{settings.API_V1_STR}/users/{superuser.id}", headers=normal_user_token_headers
    )
    assert response.status_code == 403

def test_update_user_by_id_superuser(client: TestClient, superuser_token_headers: dict, test_user: User):
    update_data = {"full_name": "Updated Test User", "is_active": False}
    response = client.put(
        f"{settings.API_V1_STR}/users/{test_user.id}", headers=superuser_token_headers, json=update_data
    )
    assert response.status_code == 200
    updated_user = response.json()
    assert updated_user["full_name"] == update_data["full_name"]
    assert updated_user["is_active"] == update_data["is_active"]

def test_delete_user_by_id_superuser(client: TestClient, superuser_token_headers: dict, test_user: User):
    response = client.delete(
        f"{settings.API_V1_STR}/users/{test_user.id}", headers=superuser_token_headers
    )
    assert response.status_code == 204
    # Verify user is truly deleted
    response = client.get(
        f"{settings.API_V1_STR}/users/{test_user.id}", headers=superuser_token_headers
    )
    assert response.status_code == 404

def test_delete_user_by_id_normal_user_forbidden(client: TestClient, normal_user_token_headers: dict, superuser: User):
    response = client.delete(
        f"{settings.API_V1_STR}/users/{superuser.id}", headers=normal_user_token_headers
    )
    assert response.status_code == 403

```