```python
import pytest
from httpx import AsyncClient
from app.crud.user import crud_user
from app.schemas.user import UserCreate, UserUpdate
from app.exceptions.custom_exceptions import EntityNotFoundException, ForbiddenException

@pytest.mark.asyncio
async def test_read_users_admin(admin_authorized_client: AsyncClient):
    response = await admin_authorized_client.get("/api/v1/users/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1 # At least the admin user
    assert "email" in data[0]

@pytest.mark.asyncio
async def test_read_users_non_admin(authorized_client: AsyncClient):
    response = await authorized_client.get("/api/v1/users/")
    assert response.status_code == 403
    assert "enough privileges" in response.json()["detail"]

@pytest.mark.asyncio
async def test_read_user_me(authorized_client: AsyncClient, test_user):
    response = await authorized_client.get("/api/v1/users/me")
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == test_user.email
    assert data["id"] == test_user.id

@pytest.mark.asyncio
async def test_update_user_me(authorized_client: AsyncClient, test_user):
    update_data = {"full_name": "Updated Test User Name"}
    response = await authorized_client.put("/api/v1/users/me", json=update_data)
    assert response.status_code == 200
    data = response.json()
    assert data["full_name"] == "Updated Test User Name"

    # Verify in DB
    updated_user_db = await crud_user.get(authorized_client.app.dependency_overrides[app.core.db.get_db](), test_user.id)
    assert updated_user_db.full_name == "Updated Test User Name"

@pytest.mark.asyncio
async def test_update_user_me_change_role_forbidden(authorized_client: AsyncClient):
    update_data = {"role": "admin"}
    response = await authorized_client.put("/api/v1/users/me", json=update_data)
    assert response.status_code == 403
    assert "Not authorized to change user role" in response.json()["detail"]

@pytest.mark.asyncio
async def test_read_user_by_id_admin(admin_authorized_client: AsyncClient, test_user):
    response = await admin_authorized_client.get(f"/api/v1/users/{test_user.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == test_user.email

@pytest.mark.asyncio
async def test_read_user_by_id_non_admin(authorized_client: AsyncClient, test_user):
    response = await authorized_client.get(f"/api/v1/users/{test_user.id}")
    assert response.status_code == 403
    assert "enough privileges" in response.json()["detail"] # From get_current_admin_user dependency

@pytest.mark.asyncio
async def test_update_user_by_id_admin(admin_authorized_client: AsyncClient, test_user):
    update_data = {"is_active": False, "role": "admin"}
    response = await admin_authorized_client.put(f"/api/v1/users/{test_user.id}", json=update_data)
    assert response.status_code == 200
    data = response.json()
    assert data["is_active"] is False
    assert data["role"] == "admin"

    # Verify in DB
    updated_user_db = await crud_user.get(admin_authorized_client.app.dependency_overrides[app.core.db.get_db](), test_user.id)
    assert updated_user_db.is_active is False
    assert updated_user_db.role == "admin"

@pytest.mark.asyncio
async def test_delete_user_by_id_admin(admin_authorized_client: AsyncClient, test_user):
    response = await admin_authorized_client.delete(f"/api/v1/users/{test_user.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == test_user.id

    # Verify user is truly deleted
    response_get = await admin_authorized_client.get(f"/api/v1/users/{test_user.id}")
    assert response_get.status_code == 404
```