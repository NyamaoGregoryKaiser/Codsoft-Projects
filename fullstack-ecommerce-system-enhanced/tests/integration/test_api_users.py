```python
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.crud.crud_user import get_user
from app.schemas.user import UserCreate, UserUpdate
from app.core.config import settings

@pytest.mark.asyncio
async def test_create_new_user_as_admin(client: AsyncClient, admin_token_headers: dict, db_session: AsyncSession):
    user_data = {
        "email": "newuser@example.com",
        "password": "newpassword",
        "first_name": "New",
        "last_name": "User",
        "is_admin": False
    }
    response = await client.post("/api/v1/users/", json=user_data, headers=admin_token_headers)
    
    assert response.status_code == 201
    created_user = response.json()
    assert created_user["email"] == user_data["email"]
    assert created_user["is_admin"] is False
    assert created_user["id"] is not None

    user_db = await get_user(db_session, created_user["id"])
    assert user_db is not None
    assert user_db.email == user_data["email"]

@pytest.mark.asyncio
async def test_create_new_user_as_regular_user_forbidden(client: AsyncClient, regular_user_token_headers: dict):
    user_data = {
        "email": "forbidden@example.com",
        "password": "password",
        "is_admin": False
    }
    response = await client.post("/api/v1/users/", json=user_data, headers=regular_user_token_headers)
    assert response.status_code == 403
    assert "Not authorized to create users" in response.json()["detail"]

@pytest.mark.asyncio
async def test_read_users_as_admin(client: AsyncClient, admin_token_headers: dict, seeded_db_session: AsyncSession):
    response = await client.get("/api/v1/users/", headers=admin_token_headers)
    assert response.status_code == 200
    users = response.json()
    assert isinstance(users, list)
    assert len(users) >= 2 # Admin + regular user from seeded_db_session

@pytest.mark.asyncio
async def test_read_users_as_regular_user_forbidden(client: AsyncClient, regular_user_token_headers: dict):
    response = await client.get("/api/v1/users/", headers=regular_user_token_headers)
    assert response.status_code == 403
    assert "Not authorized to list users" in response.json()["detail"]

@pytest.mark.asyncio
async def test_read_user_by_id_as_admin(client: AsyncClient, admin_token_headers: dict, seeded_db_session: AsyncSession):
    # Get regular user ID from seeded_db_session
    regular_user = await client.get("/api/v1/auth/me", headers=regular_user_token_headers)
    user_id = regular_user.json()["id"]

    response = await client.get(f"/api/v1/users/{user_id}", headers=admin_token_headers)
    assert response.status_code == 200
    user_data = response.json()
    assert user_data["id"] == user_id
    assert user_data["email"] == "test_user@example.com"

@pytest.mark.asyncio
async def test_read_user_by_id_as_self(client: AsyncClient, regular_user_token_headers: dict):
    regular_user_info = await client.get("/api/v1/auth/me", headers=regular_user_token_headers)
    user_id = regular_user_info.json()["id"]

    response = await client.get(f"/api/v1/users/{user_id}", headers=regular_user_token_headers)
    assert response.status_code == 200
    user_data = response.json()
    assert user_data["id"] == user_id

@pytest.mark.asyncio
async def test_read_user_by_id_as_other_user_forbidden(client: AsyncClient, regular_user_token_headers: dict, admin_token_headers: dict):
    # Attempt to read admin's profile as regular user
    admin_info = await client.get("/api/v1/auth/me", headers=admin_token_headers)
    admin_id = admin_info.json()["id"]

    response = await client.get(f"/api/v1/users/{admin_id}", headers=regular_user_token_headers)
    assert response.status_code == 403
    assert "Not authorized to access this user's profile" in response.json()["detail"]

@pytest.mark.asyncio
async def test_update_existing_user_as_admin(client: AsyncClient, admin_token_headers: dict, seeded_db_session: AsyncSession):
    regular_user_info = await client.get("/api/v1/auth/me", headers=regular_user_token_headers)
    user_id = regular_user_info.json()["id"]

    update_data = {"first_name": "UpdatedName", "is_active": False}
    response = await client.put(f"/api/v1/users/{user_id}", json=update_data, headers=admin_token_headers)
    assert response.status_code == 200
    updated_user = response.json()
    assert updated_user["first_name"] == update_data["first_name"]
    assert updated_user["is_active"] == update_data["is_active"]
    
    user_db = await get_user(seeded_db_session, user_id)
    assert user_db.first_name == update_data["first_name"]
    assert user_db.is_active == update_data["is_active"]

@pytest.mark.asyncio
async def test_update_existing_user_as_self(client: AsyncClient, regular_user_token_headers: dict):
    regular_user_info = await client.get("/api/v1/auth/me", headers=regular_user_token_headers)
    user_id = regular_user_info.json()["id"]

    update_data = {"first_name": "SelfUpdated"}
    response = await client.put(f"/api/v1/users/{user_id}", json=update_data, headers=regular_user_token_headers)
    assert response.status_code == 200
    updated_user = response.json()
    assert updated_user["first_name"] == update_data["first_name"]

@pytest.mark.asyncio
async def test_update_existing_user_as_other_user_forbidden(client: AsyncClient, regular_user_token_headers: dict, admin_token_headers: dict):
    admin_info = await client.get("/api/v1/auth/me", headers=admin_token_headers)
    admin_id = admin_info.json()["id"]

    update_data = {"first_name": "Attacked"}
    response = await client.put(f"/api/v1/users/{admin_id}", json=update_data, headers=regular_user_token_headers)
    assert response.status_code == 403
    assert "Not authorized to update this user's profile" in response.json()["detail"]

@pytest.mark.asyncio
async def test_regular_user_cannot_update_admin_status(client: AsyncClient, regular_user_token_headers: dict):
    regular_user_info = await client.get("/api/v1/auth/me", headers=regular_user_token_headers)
    user_id = regular_user_info.json()["id"]

    update_data = {"is_admin": True}
    response = await client.put(f"/api/v1/users/{user_id}", json=update_data, headers=regular_user_token_headers)
    assert response.status_code == 403
    assert "Regular users cannot change admin status" in response.json()["detail"]

@pytest.mark.asyncio
async def test_delete_existing_user_as_admin(client: AsyncClient, admin_token_headers: dict, seeded_db_session: AsyncSession):
    regular_user_info = await client.get("/api/v1/auth/me", headers=regular_user_token_headers)
    user_id = regular_user_info.json()["id"]

    response = await client.delete(f"/api/v1/users/{user_id}", headers=admin_token_headers)
    assert response.status_code == 204
    assert response.content == b""

    user_db = await get_user(seeded_db_session, user_id)
    assert user_db is None

@pytest.mark.asyncio
async def test_delete_existing_user_as_regular_user_forbidden(client: AsyncClient, regular_user_token_headers: dict):
    regular_user_info = await client.get("/api/v1/auth/me", headers=regular_user_token_headers)
    user_id = regular_user_info.json()["id"]

    response = await client.delete(f"/api/v1/users/{user_id}", headers=regular_user_token_headers)
    assert response.status_code == 403
    assert "Not authorized to delete users" in response.json()["detail"] # This indicates the admin check happens first

@pytest.mark.asyncio
async def test_admin_cannot_delete_self(client: AsyncClient, admin_token_headers: dict):
    admin_info = await client.get("/api/v1/auth/me", headers=admin_token_headers)
    admin_id = admin_info.json()["id"]

    response = await client.delete(f"/api/v1/users/{admin_id}", headers=admin_token_headers)
    assert response.status_code == 403
    assert "Admins cannot delete their own account via this endpoint" in response.json()["detail"]

```