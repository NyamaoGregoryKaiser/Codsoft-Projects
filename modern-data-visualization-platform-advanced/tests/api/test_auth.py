import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.core.security import verify_password, get_password_hash

pytestmark = pytest.mark.asyncio

async def test_register_user(client: AsyncClient, db_session: AsyncSession):
    response = await client.post(
        "/api/v1/users/register",
        json={"email": "newuser@example.com", "password": "newpassword"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newuser@example.com"
    assert "id" in data
    assert "created_at" in data
    assert "updated_at" in data

    # Verify user in DB
    user_in_db = await db_session.get(User, data["id"])
    assert user_in_db is not None
    assert user_in_db.email == "newuser@example.com"
    assert verify_password("newpassword", user_in_db.hashed_password)

async def test_register_existing_user(client: AsyncClient, create_test_user: User):
    response = await client.post(
        "/api/v1/users/register",
        json={"email": create_test_user.email, "password": "anypassword"}
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Email already registered"

async def test_login_success(client: AsyncClient, create_test_user: User, test_user_data):
    response = await client.post(
        "/api/v1/users/login",
        data={"username": test_user_data["email"], "password": test_user_data["password"]}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

async def test_login_invalid_credentials(client: AsyncClient):
    response = await client.post(
        "/api/v1/users/login",
        data={"username": "nonexistent@example.com", "password": "wrongpassword"}
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect email or password"

async def test_login_inactive_user(client: AsyncClient, db_session: AsyncSession):
    inactive_user = User(
        email="inactive@example.com",
        hashed_password=get_password_hash("password"),
        is_active=False,
        is_superuser=False
    )
    db_session.add(inactive_user)
    await db_session.commit()
    await db_session.refresh(inactive_user)

    response = await client.post(
        "/api/v1/users/login",
        data={"username": "inactive@example.com", "password": "password"}
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Inactive user"

async def test_read_users_me(client: AsyncClient, create_test_user: User, get_auth_token: str):
    response = await client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {get_auth_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == create_test_user.email
    assert data["id"] == create_test_user.id

async def test_read_users_me_unauthenticated(client: AsyncClient):
    response = await client.get("/api/v1/users/me")
    assert response.status_code == 401
    assert response.json()["detail"] == "Not authenticated"

async def test_update_users_me(client: AsyncClient, create_test_user: User, get_auth_token: str):
    response = await client.put(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {get_auth_token}"},
        json={"email": "updated@example.com", "password": "newstrongpassword"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "updated@example.com"

    # Verify in DB
    user_in_db = await client.app.dependency_overrides[get_current_active_user](client.app.dependency_overrides[get_db](), get_auth_token)
    assert user_in_db.email == "updated@example.com"
    assert verify_password("newstrongpassword", user_in_db.hashed_password)

async def test_read_users_as_admin(client: AsyncClient, create_test_admin_user: User, get_admin_auth_token: str):
    response = await client.get(
        "/api/v1/users/",
        headers={"Authorization": f"Bearer {get_admin_auth_token}"}
    )
    assert response.status_code == 200
    assert isinstance(response.json(), list)
    # Check if the admin user themselves is in the list
    assert any(user["email"] == create_test_admin_user.email for user in response.json())

async def test_read_users_as_normal_user(client: AsyncClient, create_test_user: User, get_auth_token: str):
    response = await client.get(
        "/api/v1/users/",
        headers={"Authorization": f"Bearer {get_auth_token}"}
    )
    assert response.status_code == 403
    assert response.json()["detail"] == "The user doesn't have enough privileges"