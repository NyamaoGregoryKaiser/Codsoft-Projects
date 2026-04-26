```python
import pytest
from httpx import AsyncClient
from app.crud.user import crud_user
from app.schemas.user import UserCreate, UserUpdate

@pytest.mark.asyncio
async def test_read_users_admin(client: AsyncClient, admin_token_headers):
    """Admin should be able to retrieve all users."""
    response = await client.get("/api/v1/users/", headers=admin_token_headers)
    assert response.status_code == 200
    users = response.json()
    assert len(users) >= 2 # At least admin and regular user from init_db
    assert any(user["email"] == "admin@example.com" for user in users)
    assert any(user["email"] == "user@example.com" for user in users)

@pytest.mark.asyncio
async def test_read_users_non_admin_forbidden(client: AsyncClient, regular_user_token_headers):
    """Non-admin users should not be able to retrieve all users."""
    response = await client.get("/api/v1/users/", headers=regular_user_token_headers)
    assert response.status_code == 403
    assert "Operation not permitted" in response.json()["detail"]

@pytest.mark.asyncio
async def test_create_user_admin(client: AsyncClient, admin_token_headers):
    """Admin should be able to create a new user."""
    user_data = {"email": "newadmin@example.com", "password": "testpassword", "full_name": "New Admin", "role": "admin"}
    response = await client.post("/api/v1/users/", json=user_data, headers=admin_token_headers)
    assert response.status_code == 201
    created_user = response.json()
    assert created_user["email"] == "newadmin@example.com"
    assert created_user["role"] == "admin" # Admin can create other admins

@pytest.mark.asyncio
async def test_create_user_non_admin_forbidden(client: AsyncClient, regular_user_token_headers):
    """Non-admin users should not be able to create users."""
    user_data = {"email": "another@example.com", "password": "testpassword"}
    response = await client.post("/api/v1/users/", json=user_data, headers=regular_user_token_headers)
    assert response.status_code == 403

@pytest.mark.asyncio
async def test_read_user_me_success(client: AsyncClient, regular_user_token_headers, test_regular_user):
    """Authenticated user should be able to read their own profile."""
    response = await client.get("/api/v1/users/me", headers=regular_user_token_headers)
    assert response.status_code == 200
    user_data = response.json()
    assert user_data["email"] == test_regular_user.email
    assert user_data["id"] == test_regular_user.id

@pytest.mark.asyncio
async def test_update_user_me_success(client: AsyncClient, regular_user_token_headers, test_regular_user, db_session):
    """Authenticated user should be able to update their own profile (non-sensitive fields)."""
    update_data = {"full_name": "Updated Regular User"}
    response = await client.put("/api/v1/users/me", json=update_data, headers=regular_user_token_headers)
    assert response.status_code == 200
    updated_user = response.json()
    assert updated_user["full_name"] == "Updated Regular User"
    # Verify in DB
    user_in_db = crud_user.get_by_id(db_session, id=test_regular_user.id)
    assert user_in_db.full_name == "Updated Regular User"

@pytest.mark.asyncio
async def test_update_user_me_role_change_forbidden(client: AsyncClient, regular_user_token_headers):
    """User should not be able to change their own role via /me endpoint."""
    update_data = {"role": "admin"}
    response = await client.put("/api/v1/users/me", json=update_data, headers=regular_user_token_headers)
    assert response.status_code == 200 # It should accept, but ignore role change
    updated_user = response.json()
    assert updated_user["role"] == "user" # Role should remain 'user'

@pytest.mark.asyncio
async def test_read_user_by_id_admin(client: AsyncClient, admin_token_headers, test_regular_user):
    """Admin should be able to read any user's profile by ID."""
    response = await client.get(f"/api/v1/users/{test_regular_user.id}", headers=admin_token_headers)
    assert response.status_code == 200
    user_data = response.json()
    assert user_data["email"] == test_regular_user.email

@pytest.mark.asyncio
async def test_read_user_by_id_non_admin_forbidden(client: AsyncClient, regular_user_token_headers, test_admin_user):
    """Non-admin users should not be able to read other users by ID."""
    response = await client.get(f"/api/v1/users/{test_admin_user.id}", headers=regular_user_token_headers)
    assert response.status_code == 403

@pytest.mark.asyncio
async def test_update_user_by_id_admin(client: AsyncClient, admin_token_headers, test_regular_user, db_session):
    """Admin should be able to update any user by ID."""
    update_data = {"full_name": "Admin Updated Name", "is_active": False, "role": "admin"}
    response = await client.put(f"/api/v1/users/{test_regular_user.id}", json=update_data, headers=admin_token_headers)
    assert response.status_code == 200
    updated_user = response.json()
    assert updated_user["full_name"] == "Admin Updated Name"
    assert updated_user["is_active"] is False
    assert updated_user["role"] == "admin"
    # Verify in DB
    user_in_db = crud_user.get_by_id(db_session, id=test_regular_user.id)
    assert user_in_db.full_name == "Admin Updated Name"
    assert user_in_db.is_active is False
    assert user_in_db.role == "admin"

@pytest.mark.asyncio
async def test_update_user_by_id_admin_cannot_modify_other_admin_role_or_active(client: AsyncClient, admin_token_headers, create_another_user):
    """Admin cannot modify another admin's role or active status."""
    another_admin = create_another_user(email="another.admin@example.com", password="adminpassword", role="admin")
    
    # Attempt to deactivate another admin
    update_data_deactivate = {"is_active": False}
    response_deactivate = await client.put(f"/api/v1/users/{another_admin.id}", json=update_data_deactivate, headers=admin_token_headers)
    assert response_deactivate.status_code == 403
    assert "Admins cannot modify another admin's role or active status" in response_deactivate.json()["detail"]

    # Attempt to change role of another admin
    update_data_change_role = {"role": "user"}
    response_change_role = await client.put(f"/api/v1/users/{another_admin.id}", json=update_data_change_role, headers=admin_token_headers)
    assert response_change_role.status_code == 403
    assert "Admins cannot modify another admin's role or active status" in response_change_role.json()["detail"]

@pytest.mark.asyncio
async def test_update_user_by_id_admin_cannot_modify_own_role_or_active(client: AsyncClient, admin_token_headers, test_admin_user):
    """Admin cannot modify their own role or active status."""
    # Attempt to deactivate self
    update_data_deactivate = {"is_active": False}
    response_deactivate = await client.put(f"/api/v1/users/{test_admin_user.id}", json=update_data_deactivate, headers=admin_token_headers)
    assert response_deactivate.status_code == 403
    assert "Admins cannot modify their own role or active status" in response_deactivate.json()["detail"]

    # Attempt to change role of self
    update_data_change_role = {"role": "user"}
    response_change_role = await client.put(f"/api/v1/users/{test_admin_user.id}", json=update_data_change_role, headers=admin_token_headers)
    assert response_change_role.status_code == 403
    assert "Admins cannot modify their own role or active status" in response_change_role.json()["detail"]

@pytest.mark.asyncio
async def test_delete_user_admin(client: AsyncClient, admin_token_headers, create_another_user):
    """Admin should be able to delete a regular user."""
    user_to_delete = create_another_user(email="todelete@example.com", password="password")
    response = await client.delete(f"/api/v1/users/{user_to_delete.id}", headers=admin_token_headers)
    assert response.status_code == 200
    assert "User deleted successfully" in response.json()["message"]

@pytest.mark.asyncio
async def test_delete_user_admin_cannot_delete_self(client: AsyncClient, admin_token_headers, test_admin_user):
    """Admin should not be able to delete themselves."""
    response = await client.delete(f"/api/v1/users/{test_admin_user.id}", headers=admin_token_headers)
    assert response.status_code == 403
    assert "You cannot delete your own account" in response.json()["detail"]

@pytest.mark.asyncio
async def test_delete_user_admin_cannot_delete_other_admin(client: AsyncClient, admin_token_headers, create_another_user):
    """Admin should not be able to delete another admin."""
    another_admin = create_another_user(email="another.admin@example.com", password="adminpassword", role="admin")
    response = await client.delete(f"/api/v1/users/{another_admin.id}", headers=admin_token_headers)
    assert response.status_code == 403
    assert "You cannot delete another admin account" in response.json()["detail"]

@pytest.mark.asyncio
async def test_delete_user_non_admin_forbidden(client: AsyncClient, regular_user_token_headers, test_admin_user):
    """Non-admin users should not be able to delete any users."""
    response = await client.delete(f"/api/v1/users/{test_admin_user.id}", headers=regular_user_token_headers)
    assert response.status_code == 403
```