```python
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.models import Product, User, Cart, CartItem
from app.schemas.cart import CartItemCreate, CartUpdateItemQuantity

def test_get_user_cart_empty(client: TestClient, normal_user_token_headers: dict, test_user: User):
    response = client.get(
        f"{settings.API_V1_STR}/carts/", headers=normal_user_token_headers
    )
    assert response.status_code == 200
    cart = response.json()
    assert cart["user_id"] == test_user.id
    assert cart["items"] == []
    assert cart["total_items"] == 0
    assert cart["total_amount"] == 0.0

def test_add_item_to_cart(client: TestClient, normal_user_token_headers: dict, test_user: User, test_product: Product):
    item_data = {"product_id": test_product.id, "quantity": 2}
    response = client.post(
        f"{settings.API_V1_STR}/carts/items", headers=normal_user_token_headers, json=item_data
    )
    assert response.status_code == 200
    cart = response.json()
    assert len(cart["items"]) == 1
    assert cart["items"][0]["product_id"] == test_product.id
    assert cart["items"][0]["quantity"] == 2
    assert cart["total_amount"] == 2 * test_product.price

def test_add_item_to_cart_update_quantity(client: TestClient, normal_user_token_headers: dict, test_user: User, test_product: Product):
    # Add first item
    item_data = {"product_id": test_product.id, "quantity": 1}
    client.post(f"{settings.API_V1_STR}/carts/items", headers=normal_user_token_headers, json=item_data)
    
    # Add same item again
    item_data_2 = {"product_id": test_product.id, "quantity": 3}
    response = client.post(
        f"{settings.API_V1_STR}/carts/items", headers=normal_user_token_headers, json=item_data_2
    )
    assert response.status_code == 200
    cart = response.json()
    assert len(cart["items"]) == 1
    assert cart["items"][0]["product_id"] == test_product.id
    assert cart["items"][0]["quantity"] == 4 # 1 + 3

def test_update_cart_item_quantity(client: TestClient, normal_user_token_headers: dict, test_user: User, test_product: Product):
    # Add item
    client.post(f"{settings.API_V1_STR}/carts/items", headers=normal_user_token_headers, json={"product_id": test_product.id, "quantity": 2})

    # Update quantity
    update_data = {"quantity": 5}
    response = client.put(
        f"{settings.API_V1_STR}/carts/items/{test_product.id}", headers=normal_user_token_headers, json=update_data
    )
    assert response.status_code == 200
    cart = response.json()
    assert len(cart["items"]) == 1
    assert cart["items"][0]["quantity"] == 5
    assert cart["total_amount"] == 5 * test_product.price

def test_remove_item_from_cart(client: TestClient, normal_user_token_headers: dict, test_user: User, test_product: Product):
    # Add item
    client.post(f"{settings.API_V1_STR}/carts/items", headers=normal_user_token_headers, json={"product_id": test_product.id, "quantity": 2})

    # Remove item
    response = client.delete(
        f"{settings.API_V1_STR}/carts/items/{test_product.id}", headers=normal_user_token_headers
    )
    assert response.status_code == 200
    cart = response.json()
    assert len(cart["items"]) == 0
    assert cart["total_amount"] == 0.0

def test_update_cart_item_quantity_to_zero_removes_item(client: TestClient, normal_user_token_headers: dict, test_user: User, test_product: Product):
    # Add item
    client.post(f"{settings.API_V1_STR}/carts/items", headers=normal_user_token_headers, json={"product_id": test_product.id, "quantity": 2})

    # Update quantity to 0
    update_data = {"quantity": 0}
    response = client.put(
        f"{settings.API_V1_STR}/carts/items/{test_product.id}", headers=normal_user_token_headers, json=update_data
    )
    assert response.status_code == 200
    cart = response.json()
    assert len(cart["items"]) == 0

def test_clear_cart(client: TestClient, normal_user_token_headers: dict, test_user: User, test_product: Product):
    # Add multiple items
    product_2 = client.post(f"{settings.API_V1_STR}/products/", headers=superuser_token_headers(client, test_user), json={
        "name": "Another Test Product", "description": "...", "price": 20.0, "stock": 10
    }).json()
    client.post(f"{settings.API_V1_STR}/carts/items", headers=normal_user_token_headers, json={"product_id": test_product.id, "quantity": 2})
    client.post(f"{settings.API_V1_STR}/carts/items", headers=normal_user_token_headers, json={"product_id": product_2["id"], "quantity": 1})

    # Clear cart
    response = client.post(
        f"{settings.API_V1_STR}/carts/clear", headers=normal_user_token_headers
    )
    assert response.status_code == 200
    cart = response.json()
    assert len(cart["items"]) == 0
    assert cart["total_items"] == 0
    assert cart["total_amount"] == 0.0

```