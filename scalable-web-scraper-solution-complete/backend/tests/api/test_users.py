import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import UserRole
from app.crud.user import user as crud_user

@pytest.mark.asyncio
async def test_create_user_as_admin(client: AsyncClient, db_session: AsyncSession, admin_token_headers: dict):
    response = await client.post(
        "/api/v1/users/",
        json={"email": "newuser@example.com", "password": "password123", "role": "user"},
        headers=admin_token_headers
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newuser@example.com"
    assert data["role"] == UserRole.USER.value

@pytest.mark.asyncio
async def test_create_user_as_regular_user_forbidden(client: AsyncClient, regular_user_token_headers: dict):
    response = await client.post(
        "/api/v1/users/",
        json={"email": "another@example.com", "password": "password123"},
        headers=regular_user_token_headers
    )
    assert response.status_code == 403
    assert response.json()["detail"] == "Not authorized to perform this action. Admin privilege required."

@pytest.mark.asyncio
async def test_read_users_as_admin(client: AsyncClient, db_session: AsyncSession, admin_token_headers: dict, create_user):
    await create_user("user1@example.com", "pass1")
    await create_user("user2@example.com", "pass2", UserRole.ADMIN)
    response = await client.get("/api/v1/users/", headers=admin_token_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 3 # Includes admin_user from fixture and two created users
    assert any(user["email"] == "user1@example.com" for user in data)
    assert any(user["email"] == "user2@example.com" for user in data)

@pytest.mark.asyncio
async def test_read_users_me(client: AsyncClient, regular_user, regular_user_token_headers: dict):
    response = await client.get("/api/v1/users/me", headers=regular_user_token_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == regular_user.email
    assert data["id"] == regular_user.id

@pytest.mark.asyncio
async def test_read_user_by_id_as_admin(client: AsyncClient, db_session: AsyncSession, admin_token_headers: dict, regular_user):
    response = await client.get(f"/api/v1/users/{regular_user.id}", headers=admin_token_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == regular_user.email

@pytest.mark.asyncio
async def test_update_user_as_admin(client: AsyncClient, db_session: AsyncSession, admin_token_headers: dict, regular_user):
    response = await client.put(
        f"/api/v1/users/{regular_user.id}",
        json={"email": "updated_user@example.com", "is_active": False},
        headers=admin_token_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "updated_user@example.com"
    assert data["is_active"] is False

    db_user = await crud_user.get(db_session, id=regular_user.id)
    assert db_user.email == "updated_user@example.com"
    assert db_user.is_active is False

@pytest.mark.asyncio
async def test_delete_user_as_admin(client: AsyncClient, db_session: AsyncSession, admin_token_headers: dict, regular_user):
    response = await client.delete(f"/api/v1/users/{regular_user.id}", headers=admin_token_headers)
    assert response.status_code == 204

    db_user = await crud_user.get(db_session, id=regular_user.id)
    assert db_user is None
```