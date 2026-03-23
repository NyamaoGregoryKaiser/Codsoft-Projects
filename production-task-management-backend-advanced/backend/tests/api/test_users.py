import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.schemas.user import UserCreate, UserUpdate
from app.db.models import UserRole

@pytest.mark.asyncio
async def test_get_users_superuser(client: AsyncClient, superuser_token_headers: dict):
    response = await client.get(
        f"{settings.API_V1_STR}/users/",
        headers=superuser_token_headers
    )
    assert response.status_code == 200
    assert isinstance(response.json(), list)
    assert any(user["email"] == settings.FIRST_SUPERUSER_EMAIL for user in response.json())

@pytest.mark.asyncio
async def test_get_users_normal_user(client: AsyncClient, normal_user_token_headers: tuple):
    headers, _ = normal_user_token_headers
    response = await client.get(
        f"{settings.API_V1_STR}/users/",
        headers=headers
    )
    assert response.status_code == 403
    assert "Not authorized" in response.json()["detail"]

@pytest.mark.asyncio
async def test_create_user_superuser(client: AsyncClient, superuser_token_headers: dict):
    user_data = {
        "email": "newuser@example.com",
        "password": "securepassword",
        "full_name": "New Test User",
        "role": UserRole.USER.value
    }
    response = await client.post(
        f"{settings.API_V1_STR}/users/",
        json=user_data,
        headers=superuser_token_headers
    )
    assert response.status_code == 201
    created_user = response.json()
    assert created_user["email"] == user_data["email"]
    assert created_user["full_name"] == user_data["full_name"]
    assert created_user["role"] == user_data["role"]
    assert "hashed_password" not in created_user # Should not expose hashed password

@pytest.mark.asyncio
async def test_create_existing_user_superuser(client: AsyncClient, superuser_token_headers: dict):
    user_data = {
        "email": settings.FIRST_SUPERUSER_EMAIL, # Use existing email
        "password": "securepassword",
        "full_name": "Existing User"
    }
    response = await client.post(
        f"{settings.API_V1_STR}/users/",
        json=user_data,
        headers=superuser_token_headers
    )
    assert response.status_code == 409
    assert "User with this email" in response.json()["detail"]

@pytest.mark.asyncio
async def test_get_user_by_id_superuser(client: AsyncClient, db_session: AsyncSession, superuser_token_headers: dict):
    # Create a user first
    user_data = UserCreate(email="fetchme@example.com", password="password", full_name="Fetch Me")
    created_user = await crud_user.create(db_session, obj_in=user_data)

    response = await client.get(
        f"{settings.API_V1_STR}/users/{created_user.id}",
        headers=superuser_token_headers
    )
    assert response.status_code == 200
    fetched_user = response.json()
    assert fetched_user["email"] == created_user.email
    assert fetched_user["id"] == created_user.id

@pytest.mark.asyncio
async def test_get_user_by_id_not_found(client: AsyncClient, superuser_token_headers: dict):
    response = await client.get(
        f"{settings.API_V1_STR}/users/9999", # Non-existent ID
        headers=superuser_token_headers
    )
    assert response.status_code == 404
    assert "User with ID '9999' not found" in response.json()["detail"]

@pytest.mark.asyncio
async def test_update_user_superuser(client: AsyncClient, db_session: AsyncSession, superuser_token_headers: dict):
    user_data = UserCreate(email="updateuser@example.com", password="password", full_name="Update Me")
    user_to_update = await crud_user.create(db_session, obj_in=user_data)

    update_payload = {"full_name": "Updated Name", "is_active": False}
    response = await client.put(
        f"{settings.API_V1_STR}/users/{user_to_update.id}",
        json=update_payload,
        headers=superuser_token_headers
    )
    assert response.status_code == 200
    updated_user = response.json()
    assert updated_user["full_name"] == "Updated Name"
    assert updated_user["is_active"] is False
    assert updated_user["email"] == user_to_update.email # Email should not change if not provided

    # Test changing password
    update_password_payload = {"password": "newsecurepassword"}
    response = await client.put(
        f"{settings.API_V1_STR}/users/{user_to_update.id}",
        json=update_password_payload,
        headers=superuser_token_headers
    )
    assert response.status_code == 200
    # Verify password change via authentication (manual check since hash isn't exposed)
    auth_response = await client.post(
        f"{settings.API_V1_STR}/auth/login",
        data={"username": user_to_update.email, "password": "newsecurepassword"}
    )
    assert auth_response.status_code == 200

@pytest.mark.asyncio
async def test_delete_user_superuser(client: AsyncClient, db_session: AsyncSession, superuser_token_headers: dict):
    user_data = UserCreate(email="deleteme@example.com", password="password", full_name="Delete Me")
    user_to_delete = await crud_user.create(db_session, obj_in=user_data)

    response = await client.delete(
        f"{settings.API_V1_STR}/users/{user_to_delete.id}",
        headers=superuser_token_headers
    )
    assert response.status_code == 200
    deleted_user = response.json()
    assert deleted_user["id"] == user_to_delete.id

    # Verify user is truly deleted
    get_response = await client.get(
        f"{settings.API_V1_STR}/users/{user_to_delete.id}",
        headers=superuser_token_headers
    )
    assert get_response.status_code == 404

@pytest.mark.asyncio
async def test_delete_own_account_superuser(client: AsyncClient, superuser_token_headers: dict, db_session: AsyncSession):
    # Find the ID of the superuser who generated the token
    response = await client.post(f"{settings.API_V1_STR}/auth/test-token", headers=superuser_token_headers)
    current_superuser_id = response.json()["id"]

    response = await client.delete(
        f"{settings.API_V1_STR}/users/{current_superuser_id}",
        headers=superuser_token_headers
    )
    assert response.status_code == 403
    assert "Cannot delete your own account" in response.json()["detail"]

@pytest.mark.asyncio
async def test_delete_user_normal_user_forbidden(client: AsyncClient, normal_user_token_headers: tuple):
    headers, _ = normal_user_token_headers
    response = await client.delete(
        f"{settings.API_V1_STR}/users/1", # Try to delete any user
        headers=headers
    )
    assert response.status_code == 403
    assert "Not authorized" in response.json()["detail"]