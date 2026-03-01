import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.crud.user import user as crud_user

@pytest.mark.asyncio
async def test_read_users_admin(client: AsyncClient, admin_user, regular_user, auth_admin_headers):
    """Test retrieving all users as an admin."""
    response = await client.get(
        f"{settings.API_V1_STR}/users/",
        headers=auth_admin_headers
    )
    assert response.status_code == 200
    users = response.json()
    assert len(users) >= 2 # At least admin and regular user
    assert any(u["email"] == admin_user.email for u in users)
    assert any(u["email"] == regular_user.email for u in users)

@pytest.mark.asyncio
async def test_read_users_non_admin(client: AsyncClient, regular_user, auth_regular_user_headers):
    """Test retrieving all users as a non-admin (should be forbidden)."""
    response = await client.get(
        f"{settings.API_V1_STR}/users/",
        headers=auth_regular_user_headers
    )
    assert response.status_code == 403
    assert response.json()["detail"] == "The user doesn't have enough privileges"

@pytest.mark.asyncio
async def test_create_user_admin(client: AsyncClient, auth_admin_headers, db_session: AsyncSession):
    """Test creating a user as an admin."""
    user_data = {"email": "newadminuser@example.com", "password": "adminpassword", "is_admin": True}
    response = await client.post(
        f"{settings.API_V1_STR}/users/",
        json=user_data,
        headers=auth_admin_headers
    )
    assert response.status_code == 201
    created_user = response.json()
    assert created_user["email"] == user_data["email"]
    assert created_user["is_admin"] is True

    user_in_db = await crud_user.get_by_email(db_session, email=user_data["email"])
    assert user_in_db is not None
    assert user_in_db.is_admin is True

@pytest.mark.asyncio
async def test_read_user_by_id_admin(client: AsyncClient, admin_user, regular_user, auth_admin_headers):
    """Test retrieving a specific user by ID as an admin."""
    response = await client.get(
        f"{settings.API_V1_STR}/users/{regular_user.id}",
        headers=auth_admin_headers
    )
    assert response.status_code == 200
    user_data = response.json()
    assert user_data["id"] == regular_user.id
    assert user_data["email"] == regular_user.email

@pytest.mark.asyncio
async def test_read_user_by_id_non_admin(client: AsyncClient, admin_user, regular_user, auth_regular_user_headers):
    """Test retrieving a specific user by ID as a non-admin (should be forbidden)."""
    response = await client.get(
        f"{settings.API_V1_STR}/users/{admin_user.id}",
        headers=auth_regular_user_headers
    )
    assert response.status_code == 403
    assert response.json()["detail"] == "The user doesn't have enough privileges"

@pytest.mark.asyncio
async def test_update_user_admin(client: AsyncClient, regular_user, auth_admin_headers, db_session: AsyncSession):
    """Test updating a user as an admin."""
    update_data = {"email": "updated_by_admin@example.com", "is_active": False}
    response = await client.put(
        f"{settings.API_V1_STR}/users/{regular_user.id}",
        json=update_data,
        headers=auth_admin_headers
    )
    assert response.status_code == 200
    updated_user = response.json()
    assert updated_user["email"] == update_data["email"]
    assert updated_user["is_active"] is False

    user_in_db = await crud_user.get(db_session, id=regular_user.id)
    assert user_in_db.email == update_data["email"]
    assert user_in_db.is_active is False

@pytest.mark.asyncio
async def test_delete_user_admin(client: AsyncClient, regular_user, auth_admin_headers, db_session: AsyncSession):
    """Test deleting a user as an admin."""
    user_id_to_delete = regular_user.id
    response = await client.delete(
        f"{settings.API_V1_STR}/users/{user_id_to_delete}",
        headers=auth_admin_headers
    )
    assert response.status_code == 204

    user_in_db = await crud_user.get(db_session, id=user_id_to_delete)
    assert user_in_db is None

@pytest.mark.asyncio
async def test_delete_user_non_admin(client: AsyncClient, admin_user, regular_user, auth_regular_user_headers):
    """Test deleting a user as a non-admin (should be forbidden)."""
    response = await client.delete(
        f"{settings.API_V1_STR}/users/{admin_user.id}",
        headers=auth_regular_user_headers
    )
    assert response.status_code == 403
    assert response.json()["detail"] == "The user doesn't have enough privileges"
```