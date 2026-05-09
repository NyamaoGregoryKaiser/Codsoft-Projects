```python
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.models import Product, User, Category
from app.schemas.product import ProductCreate

def test_create_product_superuser(client: TestClient, superuser_token_headers: dict, test_category: Category):
    product_data = {
        "name": "New Awesome Gadget",
        "description": "Very advanced gadget.",
        "price": 299.99,
        "stock": 100,
        "category_id": test_category.id,
        "image_url": "http://example.com/gadget.jpg"
    }
    response = client.post(
        f"{settings.API_V1_STR}/products/", headers=superuser_token_headers, json=product_data
    )
    assert response.status_code == 201
    assert response.json()["name"] == product_data["name"]
    assert response.json()["owner_id"] is not None

def test_create_product_normal_user_forbidden(client: TestClient, normal_user_token_headers: dict, test_category: Category):
    product_data = {
        "name": "Forbidden Gadget",
        "description": "Should not be created.",
        "price": 10.00,
        "stock": 1,
        "category_id": test_category.id,
    }
    response = client.post(
        f"{settings.API_V1_STR}/products/", headers=normal_user_token_headers, json=product_data
    )
    assert response.status_code == 403

def test_read_products(client: TestClient, test_product: Product):
    response = client.get(f"{settings.API_V1_STR}/products/")
    assert response.status_code == 200
    products = response.json()
    assert isinstance(products, list)
    assert any(p["name"] == test_product.name for p in products)

def test_read_products_with_filter_by_category(client: TestClient, test_product: Product, test_category: Category):
    response = client.get(f"{settings.API_V1_STR}/products/?category_id={test_category.id}")
    assert response.status_code == 200
    products = response.json()
    assert isinstance(products, list)
    assert len(products) > 0
    assert all(p["category_id"] == test_category.id for p in products)

def test_read_product_by_id(client: TestClient, test_product: Product):
    response = client.get(f"{settings.API_V1_STR}/products/{test_product.id}")
    assert response.status_code == 200
    product_data = response.json()
    assert product_data["name"] == test_product.name
    assert product_data["id"] == test_product.id

def test_update_product_superuser(client: TestClient, superuser_token_headers: dict, test_product: Product):
    update_data = {"name": "Updated Product Name", "price": 15.50, "stock": 45}
    response = client.put(
        f"{settings.API_V1_STR}/products/{test_product.id}", headers=superuser_token_headers, json=update_data
    )
    assert response.status_code == 200
    updated_product = response.json()
    assert updated_product["name"] == update_data["name"]
    assert updated_product["price"] == update_data["price"]
    assert updated_product["stock"] == update_data["stock"]

def test_delete_product_superuser(client: TestClient, superuser_token_headers: dict, test_product: Product):
    response = client.delete(
        f"{settings.API_V1_STR}/products/{test_product.id}", headers=superuser_token_headers
    )
    assert response.status_code == 204
    # Verify product is truly deleted
    response = client.get(f"{settings.API_V1_STR}/products/{test_product.id}")
    assert response.status_code == 404

```