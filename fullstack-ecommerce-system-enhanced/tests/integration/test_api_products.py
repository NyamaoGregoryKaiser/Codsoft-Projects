```python
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.crud.crud_product import get_product, get_category
from app.schemas.product import ProductCreate, ProductUpdate, CategoryCreate, CategoryUpdate
from decimal import Decimal

@pytest.mark.asyncio
async def test_create_category_as_admin(client: AsyncClient, admin_token_headers: dict, db_session: AsyncSession):
    category_data = {"name": "Electronics", "description": "Electronic gadgets"}
    response = await client.post("/api/v1/products/categories", json=category_data, headers=admin_token_headers)
    
    assert response.status_code == 201
    created_category = response.json()
    assert created_category["name"] == category_data["name"]
    assert created_category["id"] is not None

    db_category = await get_category(db_session, created_category["id"])
    assert db_category is not None
    assert db_category.name == category_data["name"]

@pytest.mark.asyncio
async def test_create_category_as_regular_user_forbidden(client: AsyncClient, regular_user_token_headers: dict):
    category_data = {"name": "Books", "description": "Fiction books"}
    response = await client.post("/api/v1/products/categories", json=category_data, headers=regular_user_token_headers)
    assert response.status_code == 403
    assert "Not enough privileges" in response.json()["detail"]

@pytest.mark.asyncio
async def test_read_categories_public(client: AsyncClient, seeded_db_session: AsyncSession):
    response = await client.get("/api/v1/products/categories")
    assert response.status_code == 200
    categories = response.json()
    assert isinstance(categories, list)
    assert len(categories) >= 2 # From seeded_db_session

@pytest.mark.asyncio
async def test_read_category_by_id_public(client: AsyncClient, seeded_db_session: AsyncSession):
    # Assuming category ID 1 exists from seed data
    response = await client.get("/api/v1/products/categories/1")
    assert response.status_code == 200
    category_data = response.json()
    assert category_data["id"] == 1
    assert "Electronics" in category_data["name"] # Based on seed data

@pytest.mark.asyncio
async def test_read_category_by_id_not_found(client: AsyncClient):
    response = await client.get("/api/v1/products/categories/999")
    assert response.status_code == 404
    assert "Category not found" in response.json()["detail"]

@pytest.mark.asyncio
async def test_update_category_as_admin(client: AsyncClient, admin_token_headers: dict, seeded_db_session: AsyncSession):
    category_id = 1 # From seed data
    update_data = {"name": "Updated Electronics", "description": "All updated electronic items."}
    response = await client.put(f"/api/v1/products/categories/{category_id}", json=update_data, headers=admin_token_headers)
    
    assert response.status_code == 200
    updated_category = response.json()
    assert updated_category["name"] == update_data["name"]
    assert updated_category["description"] == update_data["description"]

    db_category = await get_category(seeded_db_session, category_id)
    assert db_category.name == update_data["name"]

@pytest.mark.asyncio
async def test_delete_category_as_admin(client: AsyncClient, admin_token_headers: dict, seeded_db_session: AsyncSession):
    category_id = 2 # From seed data (Books)
    response = await client.delete(f"/api/v1/products/categories/{category_id}", headers=admin_token_headers)
    assert response.status_code == 204
    assert response.content == b""

    db_category = await get_category(seeded_db_session, category_id)
    assert db_category is None

@pytest.mark.asyncio
async def test_create_product_as_admin(client: AsyncClient, admin_token_headers: dict, seeded_db_session: AsyncSession):
    category_id = 1 # From seed data (Electronics)
    product_data = {
        "name": "New Gaming Mouse",
        "description": "Ergonomic gaming mouse",
        "price": 59.99,
        "stock_quantity": 100,
        "category_id": category_id,
        "image_url": "http://example.com/mouse.jpg",
        "is_available": True
    }
    response = await client.post("/api/v1/products/", json=product_data, headers=admin_token_headers)
    
    assert response.status_code == 201
    created_product = response.json()
    assert created_product["name"] == product_data["name"]
    assert created_product["price"] == str(product_data["price"]) # Decimal comes as string in JSON
    assert created_product["category"]["id"] == category_id

    db_product = await get_product(seeded_db_session, created_product["id"])
    assert db_product is not None
    assert db_product.name == product_data["name"]

@pytest.mark.asyncio
async def test_create_product_with_nonexistent_category_as_admin(client: AsyncClient, admin_token_headers: dict):
    product_data = {
        "name": "Invalid Product",
        "price": 10.00,
        "stock_quantity": 10,
        "category_id": 9999, # Non-existent category
    }
    response = await client.post("/api/v1/products/", json=product_data, headers=admin_token_headers)
    assert response.status_code == 400
    assert "Category ID not found" in response.json()["detail"]

@pytest.mark.asyncio
async def test_read_products_public(client: AsyncClient, seeded_db_session: AsyncSession):
    response = await client.get("/api/v1/products/")
    assert response.status_code == 200
    products = response.json()
    assert isinstance(products, list)
    assert len(products) >= 3 # From seeded_db_session (Laptop, Keyboard, Novel)
    assert any(p["name"] == "Laptop" for p in products)

@pytest.mark.asyncio
async def test_read_products_with_filters(client: AsyncClient, seeded_db_session: AsyncSession):
    # Filter by category
    category_id_electronics = 1 # Assuming "Electronics" is ID 1 from seed
    response = await client.get(f"/api/v1/products/?category_id={category_id_electronics}")
    assert response.status_code == 200
    products = response.json()
    assert len(products) >= 2 # Laptop, Keyboard
    assert all(p["category"]["id"] == category_id_electronics for p in products)

    # Filter by search term
    response = await client.get("/api/v1/products/?search=Keyboard")
    assert response.status_code == 200
    products = response.json()
    assert len(products) == 1
    assert products[0]["name"] == "Keyboard"

    # Filter by price range
    response = await client.get("/api/v1/products/?min_price=100&max_price=1000")
    assert response.status_code == 200
    products = response.json()
    assert len(products) == 1 # Only Keyboard (75) is outside, Laptop (1200) is outside
    assert products[0]["name"] == "Keyboard" # This will fail if Laptop is included

    # Let's adjust to be more specific to seeded data:
    # Laptop: 1200.00, Keyboard: 75.00, Novel: 15.50
    response = await client.get("/api/v1/products/?min_price=10&max_price=80")
    assert response.status_code == 200
    products = response.json()
    product_names = [p["name"] for p in products]
    assert "Keyboard" in product_names
    assert "Novel" in product_names
    assert "Laptop" not in product_names
    assert len(products) == 2

@pytest.mark.asyncio
async def test_read_product_by_id_public(client: AsyncClient, seeded_db_session: AsyncSession):
    # Assuming product ID 1 exists from seed data (Laptop)
    response = await client.get("/api/v1/products/1")
    assert response.status_code == 200
    product_data = response.json()
    assert product_data["id"] == 1
    assert product_data["name"] == "Laptop"
    assert "category" in product_data and product_data["category"] is not None

@pytest.mark.asyncio
async def test_update_product_as_admin(client: AsyncClient, admin_token_headers: dict, seeded_db_session: AsyncSession):
    product_id = 1 # From seed data (Laptop)
    update_data = {"price": 1150.00, "stock_quantity": 5}
    response = await client.put(f"/api/v1/products/{product_id}", json=update_data, headers=admin_token_headers)
    
    assert response.status_code == 200
    updated_product = response.json()
    assert updated_product["price"] == str(update_data["price"])
    assert updated_product["stock_quantity"] == update_data["stock_quantity"]

    db_product = await get_product(seeded_db_session, product_id)
    assert db_product.price == Decimal("1150.00")
    assert db_product.stock_quantity == 5

@pytest.mark.asyncio
async def test_update_product_as_regular_user_forbidden(client: AsyncClient, regular_user_token_headers: dict):
    product_id = 1
    update_data = {"price": 100.00}
    response = await client.put(f"/api/v1/products/{product_id}", json=update_data, headers=regular_user_token_headers)
    assert response.status_code == 403
    assert "Not enough privileges" in response.json()["detail"]

@pytest.mark.asyncio
async def test_delete_product_as_admin(client: AsyncClient, admin_token_headers: dict, seeded_db_session: AsyncSession):
    product_id = 2 # From seed data (Keyboard)
    response = await client.delete(f"/api/v1/products/{product_id}", headers=admin_token_headers)
    assert response.status_code == 204
    assert response.content == b""

    db_product = await get_product(seeded_db_session, product_id)
    assert db_product is None

```