import pytest
from httpx import AsyncClient
from app.core.config import settings
from app.schemas.user import UserCreate
from app.crud.crud_user import user as crud_user
from app.db.session import AsyncSessionLocal
from app.core.security import create_access_token
from app.models.user import User
from app.crud.crud_item import item as crud_item
from app.schemas.item import ItemCreate

# Helper to create an active, verified user and get an access token
async def get_test_auth_headers_verified(user_email: str):
    async with AsyncSessionLocal() as db:
        user_in = UserCreate(
            email=user_email,
            password="testpassword",
            first_name="Test",
            last_name="User",
            is_active=True,
            is_superuser=False,
            is_verified=True # Important for item operations
        )
        user = await crud_user.create(db, obj_in=user_in)
    
    access_token = create_access_token(data={"user_id": user.id})
    return {"Authorization": f"Bearer {access_token}"}, user

# Helper for unverified users
async def get_test_auth_headers_unverified(user_email: str):
    async with AsyncSessionLocal() as db:
        user_in = UserCreate(
            email=user_email,
            password="testpassword",
            first_name="Test",
            last_name="User",
            is_active=True,
            is_superuser=False,
            is_verified=False # Unverified
        )
        user = await crud_user.create(db, obj_in=user_in)
    
    access_token = create_access_token(data={"user_id": user.id})
    return {"Authorization": f"Bearer {access_token}"}, user


@pytest.mark.asyncio
async def test_create_item_for_current_user_success(client: AsyncClient):
    headers, user = await get_test_auth_headers_verified("itemowner@example.com")
    item_data = {"title": "My New Item", "description": "This is a description."}
    
    response = await client.post(
        f"{settings.API_V1_STR}/items/",
        headers=headers,
        json=item_data
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == item_data["title"]
    assert data["description"] == item_data["description"]
    assert data["owner_id"] == user.id
    assert "id" in data

@pytest.mark.asyncio
async def test_create_item_for_unverified_user(client: AsyncClient):
    headers, user = await get_test_auth_headers_unverified("unverified@example.com")
    item_data = {"title": "Unverified Item", "description": "Should fail."}
    
    response = await client.post(
        f"{settings.API_V1_STR}/items/",
        headers=headers,
        json=item_data
    )
    assert response.status_code == 403
    assert response.json()["detail"] == "User email not verified."

@pytest.mark.asyncio
async def test_read_current_user_items(client: AsyncClient):
    headers, user = await get_test_auth_headers_verified("itemsreader@example.com")
    
    async with AsyncSessionLocal() as db:
        await crud_item.create_with_owner(db, obj_in=ItemCreate(title="Item 1", description="Desc 1"), owner_id=user.id)
        await crud_item.create_with_owner(db, obj_in=ItemCreate(title="Item 2", description="Desc 2"), owner_id=user.id)
        # Create an item for another user
        other_user = await crud_user.create(db, obj_in=UserCreate(email="other@example.com", password="pw"))
        await crud_item.create_with_owner(db, obj_in=ItemCreate(title="Other Item", description="Desc 3"), owner_id=other_user.id)


    response = await client.get(
        f"{settings.API_V1_STR}/items/",
        headers=headers
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert {item["title"] for item in data} == {"Item 1", "Item 2"}

@pytest.mark.asyncio
async def test_read_item_by_id_owner(client: AsyncClient):
    headers, user = await get_test_auth_headers_verified("singleitem@example.com")
    
    async with AsyncSessionLocal() as db:
        item = await crud_item.create_with_owner(db, obj_in=ItemCreate(title="Single Item", description="Desc"), owner_id=user.id)

    response = await client.get(
        f"{settings.API_V1_STR}/items/{item.id}",
        headers=headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == item.id
    assert data["title"] == item.title

@pytest.mark.asyncio
async def test_read_item_by_id_not_owner(client: AsyncClient):
    headers, user = await get_test_auth_headers_verified("notowner@example.com")
    
    async with AsyncSessionLocal() as db:
        other_user = await crud_user.create(db, obj_in=UserCreate(email="another@example.com", password="pw"))
        item = await crud_item.create_with_owner(db, obj_in=ItemCreate(title="Other's Item", description="Desc"), owner_id=other_user.id)

    response = await client.get(
        f"{settings.API_V1_STR}/items/{item.id}",
        headers=headers
    )
    assert response.status_code == 404 # Should return 404, not 403, to avoid leaking info

@pytest.mark.asyncio
async def test_update_item_owner(client: AsyncClient):
    headers, user = await get_test_auth_headers_verified("updateitem@example.com")
    
    async with AsyncSessionLocal() as db:
        item = await crud_item.create_with_owner(db, obj_in=ItemCreate(title="Old Title", description="Old Desc"), owner_id=user.id)

    updated_title = "New Title"
    response = await client.put(
        f"{settings.API_V1_STR}/items/{item.id}",
        headers=headers,
        json={"title": updated_title}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == updated_title
    
    async with AsyncSessionLocal() as db:
        updated_item_db = await crud_item.get(db, id=item.id)
        assert updated_item_db.title == updated_title

@pytest.mark.asyncio
async def test_delete_item_owner(client: AsyncClient):
    headers, user = await get_test_auth_headers_verified("deleteitem@example.com")
    
    async with AsyncSessionLocal() as db:
        item = await crud_item.create_with_owner(db, obj_in=ItemCreate(title="To Be Deleted", description=""), owner_id=user.id)

    response = await client.delete(
        f"{settings.API_V1_STR}/items/{item.id}",
        headers=headers
    )
    assert response.status_code == 204

    async with AsyncSessionLocal() as db:
        deleted_item = await crud_item.get(db, id=item.id)
        assert deleted_item is None
```