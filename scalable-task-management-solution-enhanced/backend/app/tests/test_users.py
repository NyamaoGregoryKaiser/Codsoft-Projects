import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.schemas.user import UserCreate

@pytest.mark.asyncio
async def test_get_users_superuser(client: AsyncClient, superuser_token_headers, create_user):
    user1 = await create_user(username="user1", email="user1@example.com")
    user2 = await create_user(username="user2", email="user2@example.com")
    response = await client.get(f"{settings.API_V1_STR}/users/", headers=superuser_token_headers)
    assert response.status_code == 200
    users = response.json()
    assert isinstance(users, list)
    assert len(users) >= 3 # Superuser + user1 + user2 + default test user if any

@pytest.mark.asyncio
async def test_get_users_regular_user_forbidden(client: AsyncClient, regular_user_token_headers):
    response = await client.get(f"{settings.API_V1_STR}/users/", headers=regular_user_token_headers)
    assert response.status_code == 403
    assert "Not authorized to view all users." in response.json()["message"]

@pytest.mark.asyncio
async def test_get_user_by_id_superuser(client: AsyncClient, superuser_token_headers, create_user):
    user = await create_user(username="target", email="target@example.com")
    response = await client.get(f"{settings.API_V1_STR}/users/{user.id}", headers=superuser_token_headers)
    assert response.status_code == 200
    retrieved_user = response.json()
    assert retrieved_user["id"] == user.id
    assert retrieved_user["email"] == user.email

@pytest.mark.asyncio
async def test_get_user_by_id_self_regular_user(client: AsyncClient, create_user):
    user = await create_user(username="self", email="self@example.com")
    response = await client.post(
        f"{settings.API_V1_STR}/auth/login",
        data={"username": user.email, "password": "password123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    response = await client.get(f"{settings.API_V1_STR}/users/{user.id}", headers=headers)
    assert response.status_code == 200
    retrieved_user = response.json()
    assert retrieved_user["id"] == user.id
    assert retrieved_user["email"] == user.email

@pytest.mark.asyncio
async def test_get_user_by_id_other_regular_user_forbidden(client: AsyncClient, regular_user_token_headers, create_user):
    user = await create_user(username="other", email="other@example.com")
    response = await client.get(f"{settings.API_V1_STR}/users/{user.id}", headers=regular_user_token_headers)
    assert response.status_code == 403
    assert "Not authorized to view this user's profile." in response.json()["message"]

@pytest.mark.asyncio
async def test_create_user_superuser(client: AsyncClient, superuser_token_headers):
    user_data = {
        "username": "created_by_admin",
        "email": "admincreate@example.com",
        "password": "password123",
        "is_superuser": False
    }
    response = await client.post(f"{settings.API_V1_STR}/users/", json=user_data, headers=superuser_token_headers)
    assert response.status_code == 201
    created_user = response.json()
    assert created_user["email"] == user_data["email"]
    assert created_user["is_superuser"] is False

@pytest.mark.asyncio
async def test_create_user_regular_user_forbidden(client: AsyncClient, regular_user_token_headers):
    user_data = {
        "username": "regular_created",
        "email": "regularcreate@example.com",
        "password": "password123",
    }
    response = await client.post(f"{settings.API_V1_STR}/users/", json=user_data, headers=regular_user_token_headers)
    assert response.status_code == 403
    assert "The user doesn't have enough privileges" in response.json()["message"]

@pytest.mark.asyncio
async def test_update_user_superuser(client: AsyncClient, superuser_token_headers, create_user):
    user = await create_user(username="toupdate", email="toupdate@example.com")
    update_data = {"username": "updatedname", "is_active": False}
    response = await client.put(f"{settings.API_V1_STR}/users/{user.id}", json=update_data, headers=superuser_token_headers)
    assert response.status_code == 200
    updated_user = response.json()
    assert updated_user["username"] == "updatedname"
    assert updated_user["is_active"] is False

@pytest.mark.asyncio
async def test_update_user_self_regular_user(client: AsyncClient, create_user):
    user = await create_user(username="selfupdate", email="selfupdate@example.com")
    response = await client.post(
        f"{settings.API_V1_STR}/auth/login",
        data={"username": user.email, "password": "password123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    update_data = {"username": "myselfupdated", "email": "selfupdate@new.com"}
    response = await client.put(f"{settings.API_V1_STR}/users/{user.id}", json=update_data, headers=headers)
    assert response.status_code == 200
    updated_user = response.json()
    assert updated_user["username"] == "myselfupdated"
    assert updated_user["email"] == "selfupdate@new.com"

@pytest.mark.asyncio
async def test_update_user_other_regular_user_forbidden(client: AsyncClient, regular_user_token_headers, create_user):
    user = await create_user(username="otherupdate", email="otherupdate@example.com")
    update_data = {"username": "forbidden"}
    response = await client.put(f"{settings.API_V1_STR}/users/{user.id}", json=update_data, headers=regular_user_token_headers)
    assert response.status_code == 403
    assert "Not authorized to update this user's profile." in response.json()["message"]

@pytest.mark.asyncio
async def test_delete_user_superuser(client: AsyncClient, superuser_token_headers, create_user):
    user = await create_user(username="todelete", email="todelete@example.com")
    response = await client.delete(f"{settings.API_V1_STR}/users/{user.id}", headers=superuser_token_headers)
    assert response.status_code == 200
    deleted_user = response.json()
    assert deleted_user["id"] == user.id

    # Verify user is truly deleted
    response = await client.get(f"{settings.API_V1_STR}/users/{user.id}", headers=superuser_token_headers)
    assert response.status_code == 404

@pytest.mark.asyncio
async def test_delete_user_regular_user_forbidden(client: AsyncClient, regular_user_token_headers, create_user):
    user = await create_user(username="todelete_other", email="todelete_other@example.com")
    response = await client.delete(f"{settings.API_V1_STR}/users/{user.id}", headers=regular_user_token_headers)
    assert response.status_code == 403
    assert "The user doesn't have enough privileges" in response.json()["message"]

@pytest.mark.asyncio
async def test_delete_self_user_forbidden(client: AsyncClient, create_user):
    user = await create_user(username="selfdelete", email="selfdelete@example.com")
    response = await client.post(
        f"{settings.API_V1_STR}/auth/login",
        data={"username": user.email, "password": "password123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    response = await client.delete(f"{settings.API_V1_STR}/users/{user.id}", headers=headers)
    assert response.status_code == 400
    assert "Cannot delete your own user account." in response.json()["message"]