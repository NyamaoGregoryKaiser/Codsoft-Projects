```python
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.crud.crud_user import user as crud_user
from backend.app.schemas.user import UserCreate
from backend.app.core.config import settings

@pytest.mark.asyncio
async def test_get_users_superuser(client: AsyncClient, superuser_token_headers: dict):
    response = await client.get(
        f"{settings.API_V1_STR}/users/", headers=superuser_token_headers
    )
    assert response.status_code == 200
    assert isinstance(response.json(), list)

@pytest.mark.asyncio
async def test_get_users_normal_user_forbidden(client: AsyncClient, normal_user_token_headers: dict):
    response = await client.get(
        f"{settings.API_V1_STR}/users/", headers=normal_user_token_headers
    )
    assert response.status_code == 403 # Forbidden

@pytest.mark.asyncio
async def test_create_user_superuser(client: AsyncClient, superuser_token_headers: dict):
    new_user_data = {
        "username": "newuser",
        "email": "newuser@example.com",
        "password": "newpassword",
        "is_active": True,
        "is_superuser": False,
    }
    response = await client.post(
        f"{settings.API_V1_STR}/users/", json=new_user_data, headers=superuser_token_headers
    )
    assert response.status_code == 201
    created_user = response.json()
    assert created_user["email"] == "newuser@example.com"
    assert created_user["username"] == "newuser"
    assert created_user["is_superuser"] is False # Ensure admin cannot create new superuser directly without explicit flag

@pytest.mark.asyncio
async def test_create_user_existing_email(client: AsyncClient, superuser_token_headers: dict):
    existing_user_data = {
        "username": "existingemailuser",
        "email": settings.FIRST_SUPERUSER_EMAIL,
        "password": "somepassword",
    }
    response = await client.post(
        f"{settings.API_V1_STR}/users/", json=existing_user_data, headers=superuser_token_headers
    )
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]

@pytest.mark.asyncio
async def test_get_user_by_id_superuser(client: AsyncClient, superuser_token_headers: dict, db_session: AsyncSession):
    user_in = UserCreate(username="targetuser", email="target@example.com", password="pw")
    target_user = await crud_user.create(db_session, obj_in=user_in)

    response = await client.get(
        f"{settings.API_V1_STR}/users/{target_user.id}", headers=superuser_token_headers
    )
    assert response.status_code == 200
    assert response.json()["email"] == "target@example.com"

@pytest.mark.asyncio
async def test_get_user_by_id_not_found(client: AsyncClient, superuser_token_headers: dict):
    response = await client.get(
        f"{settings.API_V1_STR}/users/9999", headers=superuser_token_headers
    )
    assert response.status_code == 404

@pytest.mark.asyncio
async def test_update_user_superuser(client: AsyncClient, superuser_token_headers: dict, db_session: AsyncSession):
    user_in = UserCreate(username="updateme", email="updateme@example.com", password="oldpw")
    user_to_update = await crud_user.create(db_session, obj_in=user_in)

    update_data = {"email": "updated@example.com", "is_active": False, "password": "newpw"}
    response = await client.put(
        f"{settings.API_V1_STR}/users/{user_to_update.id}", json=update_data, headers=superuser_token_headers
    )
    assert response.status_code == 200
    updated_user = response.json()
    assert updated_user["email"] == "updated@example.com"
    assert updated_user["is_active"] is False
    # Password change is internal, not exposed directly in response

@pytest.mark.asyncio
async def test_delete_user_superuser(client: AsyncClient, superuser_token_headers: dict, db_session: AsyncSession):
    user_in = UserCreate(username="deleteme", email="deleteme@example.com", password="pw")
    user_to_delete = await crud_user.create(db_session, obj_in=user_in)

    response = await client.delete(
        f"{settings.API_V1_STR}/users/{user_to_delete.id}", headers=superuser_token_headers
    )
    assert response.status_code == 200
    deleted_user = response.json()
    assert deleted_user["email"] == "deleteme@example.com"

    # Verify user is actually deleted
    response = await client.get(
        f"{settings.API_V1_STR}/users/{user_to_delete.id}", headers=superuser_token_headers
    )
    assert response.status_code == 404

@pytest.mark.asyncio
async def test_delete_own_user_forbidden(client: AsyncClient, superuser_token_headers: dict):
    # Try to delete the superuser itself
    response = await client.delete(
        f"{settings.API_V1_STR}/users/{1}", # Assuming superuser is ID 1 from conftest setup
        headers=superuser_token_headers
    )
    assert response.status_code == 400
    assert "cannot delete yourself" in response.json()["detail"]
```