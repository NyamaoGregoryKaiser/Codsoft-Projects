```python
import pytest
from httpx import AsyncClient
from app.crud.item import crud_item
from app.schemas.item import ItemCreate, ItemUpdate

@pytest.mark.asyncio
async def test_create_item_success(client: AsyncClient, regular_user_token_headers):
    """Test creating an item by a regular user."""
    item_data = {"title": "New Task", "description": "Description for new task"}
    response = await client.post("/api/v1/items/", json=item_data, headers=regular_user_token_headers)
    assert response.status_code == 201
    created_item = response.json()
    assert created_item["title"] == "New Task"
    assert created_item["description"] == "Description for new task"
    assert "id" in created_item
    assert "owner_id" in created_item

@pytest.mark.asyncio
async def test_read_items_for_owner(client: AsyncClient, regular_user_token_headers, test_regular_user, create_test_item):
    """Test retrieving items for the owner."""
    item1 = create_test_item(owner_id=test_regular_user.id, title="User Task 1")
    item2 = create_test_item(owner_id=test_regular_user.id, title="User Task 2")
    
    response = await client.get("/api/v1/items/", headers=regular_user_token_headers)
    assert response.status_code == 200
    items = response.json()
    assert len(items) == 2
    assert any(item["title"] == "User Task 1" for item in items)
    assert any(item["title"] == "User Task 2" for item in items)

@pytest.mark.asyncio
async def test_read_items_admin_sees_all(client: AsyncClient, admin_token_headers, test_regular_user, test_admin_user, create_test_item):
    """Admin should see all items, regardless of owner."""
    create_test_item(owner_id=test_regular_user.id, title="User's Task")
    create_test_item(owner_id=test_admin_user.id, title="Admin's Task")
    
    response = await client.get("/api/v1/items/", headers=admin_token_headers)
    assert response.status_code == 200
    items = response.json()
    assert len(items) == 2
    assert any(item["title"] == "User's Task" for item in items)
    assert any(item["title"] == "Admin's Task" for item in items)

@pytest.mark.asyncio
async def test_read_item_by_id_owner(client: AsyncClient, regular_user_token_headers, test_regular_user, create_test_item):
    """Owner should be able to retrieve their own item by ID."""
    item = create_test_item(owner_id=test_regular_user.id, title="My Specific Task")
    response = await client.get(f"/api/v1/items/{item.id}", headers=regular_user_token_headers)
    assert response.status_code == 200
    assert response.json()["title"] == "My Specific Task"

@pytest.mark.asyncio
async def test_read_item_by_id_admin(client: AsyncClient, admin_token_headers, test_regular_user, create_test_item):
    """Admin should be able to retrieve any item by ID."""
    item = create_test_item(owner_id=test_regular_user.id, title="User's Task for Admin")
    response = await client.get(f"/api/v1/items/{item.id}", headers=admin_token_headers)
    assert response.status_code == 200
    assert response.json()["title"] == "User's Task for Admin"

@pytest.mark.asyncio
async def test_read_item_by_id_non_owner_forbidden(client: AsyncClient, regular_user_token_headers, create_another_user, create_test_item):
    """Non-owner (and non-admin) should not be able to retrieve another user's item."""
    another_user = create_another_user(email="another@example.com", password="password")
    item = create_test_item(owner_id=another_user.id, title="Other User's Task")
    response = await client.get(f"/api/v1/items/{item.id}", headers=regular_user_token_headers)
    assert response.status_code == 403
    assert "Not authorized to access this item" in response.json()["detail"]

@pytest.mark.asyncio
async def test_update_item_owner(client: AsyncClient, regular_user_token_headers, test_regular_user, create_test_item, db_session):
    """Owner should be able to update their own item."""
    item = create_test_item(owner_id=test_regular_user.id, title="Task to Update")
    update_data = {"title": "Updated Task Title", "is_completed": True}
    response = await client.put(f"/api/v1/items/{item.id}", json=update_data, headers=regular_user_token_headers)
    assert response.status_code == 200
    updated_item = response.json()
    assert updated_item["title"] == "Updated Task Title"
    assert updated_item["is_completed"] is True
    # Verify in DB
    item_in_db = crud_item.get_by_id(db_session, id=item.id)
    assert item_in_db.title == "Updated Task Title"
    assert item_in_db.is_completed is True

@pytest.mark.asyncio
async def test_update_item_admin(client: AsyncClient, admin_token_headers, test_regular_user, create_test_item, db_session):
    """Admin should be able to update any item."""
    item = create_test_item(owner_id=test_regular_user.id, title="Admin Update Task")
    update_data = {"description": "Admin updated description", "is_completed": True}
    response = await client.put(f"/api/v1/items/{item.id}", json=update_data, headers=admin_token_headers)
    assert response.status_code == 200
    updated_item = response.json()
    assert updated_item["description"] == "Admin updated description"
    assert updated_item["is_completed"] is True
    # Verify in DB
    item_in_db = crud_item.get_by_id(db_session, id=item.id)
    assert item_in_db.description == "Admin updated description"
    assert item_in_db.is_completed is True

@pytest.mark.asyncio
async def test_update_item_non_owner_forbidden(client: AsyncClient, regular_user_token_headers, create_another_user, create_test_item):
    """Non-owner (and non-admin) should not be able to update another user's item."""
    another_user = create_another_user(email="another@example.com", password="password")
    item = create_test_item(owner_id=another_user.id, title="Other User's Task to Update")
    update_data = {"title": "Attempted Update"}
    response = await client.put(f"/api/v1/items/{item.id}", json=update_data, headers=regular_user_token_headers)
    assert response.status_code == 403
    assert "Not authorized to update this item" in response.json()["detail"]

@pytest.mark.asyncio
async def test_delete_item_owner(client: AsyncClient, regular_user_token_headers, test_regular_user, create_test_item, db_session):
    """Owner should be able to delete their own item."""
    item = create_test_item(owner_id=test_regular_user.id, title="Task to Delete")
    response = await client.delete(f"/api/v1/items/{item.id}", headers=regular_user_token_headers)
    assert response.status_code == 200
    assert "Item deleted successfully" in response.json()["message"]
    # Verify in DB
    assert crud_item.get_by_id(db_session, id=item.id) is None

@pytest.mark.asyncio
async def test_delete_item_admin(client: AsyncClient, admin_token_headers, test_regular_user, create_test_item, db_session):
    """Admin should be able to delete any item."""
    item = create_test_item(owner_id=test_regular_user.id, title="Admin Delete Task")
    response = await client.delete(f"/api/v1/items/{item.id}", headers=admin_token_headers)
    assert response.status_code == 200
    assert "Item deleted successfully" in response.json()["message"]
    # Verify in DB
    assert crud_item.get_by_id(db_session, id=item.id) is None

@pytest.mark.asyncio
async def test_delete_item_non_owner_forbidden(client: AsyncClient, regular_user_token_headers, create_another_user, create_test_item):
    """Non-owner (and non-admin) should not be able to delete another user's item."""
    another_user = create_another_user(email="another@example.com", password="password")
    item = create_test_item(owner_id=another_user.id, title="Other User's Task to Delete")
    response = await client.delete(f"/api/v1/items/{item.id}", headers=regular_user_token_headers)
    assert response.status_code == 403
    assert "Not authorized to delete this item" in response.json()["detail"]
```