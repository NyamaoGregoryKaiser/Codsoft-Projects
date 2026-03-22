import pytest
from httpx import AsyncClient
from app.core.config import settings
from app.schemas.user import UserCreate, UserUpdate
from app.crud.crud_user import user as crud_user
from app.db.session import AsyncSessionLocal
from app.core.security import create_access_token
from app.models.user import User

# Helper to create an active user and get an access token
async def get_test_auth_headers(user_email: str, is_superuser: bool = False, is_verified: bool = True):
    async with AsyncSessionLocal() as db:
        user_in = UserCreate(
            email=user_email,
            password="testpassword",
            first_name="Test",
            last_name="User",
            is_active=True,
            is_superuser=is_superuser,
            is_verified=is_verified
        )
        user = await crud_user.create(db, obj_in=user_in)
    
    access_token = create_access_token(data={"user_id": user.id})
    return {"Authorization": f"Bearer {access_token}"}, user

@pytest.mark.asyncio
async def test_read_user_me(client: AsyncClient):
    headers, user = await get_test_auth_headers("me@example.com")
    response = await client.get(
        f"{settings.API_V1_STR}/users/me",
        headers=headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == user.email
    assert data["id"] == user.id

@pytest.mark.asyncio
async def test_read_user_me_unauthenticated(client: AsyncClient):
    response = await client.get(
        f"{settings.API_V1_STR}/users/me"
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Not authenticated."

@pytest.mark.asyncio
async def test_update_user_me(client: AsyncClient):
    headers, user = await get_test_auth_headers("update_me@example.com")
    updated_first_name = "UpdatedFirstName"
    response = await client.put(
        f"{settings.API_V1_STR}/users/me",
        headers=headers,
        json={"first_name": updated_first_name}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["first_name"] == updated_first_name
    
    async with AsyncSessionLocal() as db:
        updated_user_db = await crud_user.get(db, id=user.id)
        assert updated_user_db.first_name == updated_first_name

@pytest.mark.asyncio
async def test_update_user_me_change_password(client: AsyncClient):
    headers, user = await get_test_auth_headers("update_me_pw@example.com")
    new_password = "NewSecurePassword123!"
    response = await client.put(
        f"{settings.API_V1_STR}/users/me",
        headers=headers,
        json={"password": new_password}
    )
    assert response.status_code == 200
    
    # Verify new password
    login_response = await client.post(
        f"{settings.API_V1_STR}/auth/login",
        data={"username": user.email, "password": new_password}
    )
    assert login_response.status_code == 200

@pytest.mark.asyncio
async def test_update_user_me_duplicate_email(client: AsyncClient):
    headers, user1 = await get_test_auth_headers("user1@example.com")
    user2 = await get_test_auth_headers("user2@example.com") # Just to create another email

    response = await client.put(
        f"{settings.API_V1_STR}/users/me",
        headers=headers,
        json={"email": user2[1].email} # Try to change user1's email to user2's email
    )
    assert response.status_code == 409
    assert response.json()["detail"] == "Email already registered by another user."


@pytest.mark.asyncio
async def test_read_user_by_id_superuser(client: AsyncClient):
    admin_headers, admin_user = await get_test_auth_headers("admin_user@example.com", is_superuser=True)
    normal_user_headers, normal_user = await get_test_auth_headers("normal_user@example.com")

    response = await client.get(
        f"{settings.API_V1_STR}/users/{normal_user.id}",
        headers=admin_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == normal_user.id
    assert data["email"] == normal_user.email

@pytest.mark.asyncio
async def test_read_user_by_id_non_superuser(client: AsyncClient):
    normal_user_headers, normal_user = await get_test_auth_headers("non_admin@example.com")
    other_user = await get_test_auth_headers("other_user@example.com")

    response = await client.get(
        f"{settings.API_V1_STR}/users/{other_user[1].id}",
        headers=normal_user_headers
    )
    assert response.status_code == 403
    assert response.json()["detail"] == "Not authorized to perform this action."


@pytest.mark.asyncio
async def test_read_users_superuser(client: AsyncClient):
    admin_headers, _ = await get_test_auth_headers("admin_list@example.com", is_superuser=True)
    await get_test_auth_headers("user_for_list1@example.com")
    await get_test_auth_headers("user_for_list2@example.com")

    response = await client.get(
        f"{settings.API_V1_STR}/users/",
        headers=admin_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 3 # At least admin and the two created users

@pytest.mark.asyncio
async def test_update_user_by_id_superuser(client: AsyncClient):
    admin_headers, admin_user = await get_test_auth_headers("admin_update@example.com", is_superuser=True)
    user_to_update = await get_test_auth_headers("user_to_update@example.com")

    updated_email = "new_email_for_user@example.com"
    response = await client.put(
        f"{settings.API_V1_STR}/users/{user_to_update[1].id}",
        headers=admin_headers,
        json={"email": updated_email, "is_active": False}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == updated_email
    assert data["is_active"] is False

    async with AsyncSessionLocal() as db:
        fetched_user = await crud_user.get(db, id=user_to_update[1].id)
        assert fetched_user.email == updated_email
        assert fetched_user.is_active is False

@pytest.mark.asyncio
async def test_delete_user_superuser(client: AsyncClient):
    admin_headers, admin_user = await get_test_auth_headers("admin_delete@example.com", is_superuser=True)
    user_to_delete = await get_test_auth_headers("user_to_delete@example.com")

    response = await client.delete(
        f"{settings.API_V1_STR}/users/{user_to_delete[1].id}",
        headers=admin_headers
    )
    assert response.status_code == 204

    async with AsyncSessionLocal() as db:
        deleted_user = await crud_user.get(db, id=user_to_delete[1].id)
        assert deleted_user is None

@pytest.mark.asyncio
async def test_delete_own_superuser_account_forbidden(client: AsyncClient):
    admin_headers, admin_user = await get_test_auth_headers("admin_self_delete@example.com", is_superuser=True)
    
    response = await client.delete(
        f"{settings.API_V1_STR}/users/{admin_user.id}",
        headers=admin_headers
    )
    assert response.status_code == 403
    assert response.json()["detail"] == "Cannot delete your own superuser account."
```