```python
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.models import Product, User, Cart, CartItem, Order
from app.schemas.order import OrderStatusUpdate
from app.crud.product import crud_product

def test_create_order_from_cart(client: TestClient, normal_user_token_headers: dict, test_user: User, test_product: Product):
    # Add item to cart first
    client.post(f"{settings.API_V1_STR}/carts/items", headers=normal_user_token_headers, json={"product_id": test_product.id, "quantity": 2})

    # Place order
    response = client.post(
        f"{settings.API_V1_STR}/orders/", headers=normal_user_token_headers
    )
    assert response.status_code == 201
    order = response.json()
    assert order["user_id"] == test_user.id
    assert order["total_amount"] == 2 * test_product.price
    assert order["status"] == "pending"
    assert len(order["items"]) == 1
    assert order["items"][0]["product_id"] == test_product.id
    assert order["items"][0]["quantity"] == 2
    assert order["items"][0]["price_at_order"] == test_product.price

    # Verify cart is cleared
    cart_response = client.get(f"{settings.API_V1_STR}/carts/", headers=normal_user_token_headers)
    assert cart_response.status_code == 200
    assert cart_response.json()["total_items"] == 0

    # Verify product stock decreased (manual check in test)
    # Using a direct call to the product endpoint, not ideal for a pure integration test but illustrates behavior
    product_response = client.get(f"{settings.API_V1_STR}/products/{test_product.id}")
    assert product_response.status_code == 200
    assert product_response.json()["stock"] == test_product.stock - 2


def test_create_order_empty_cart(client: TestClient, normal_user_token_headers: dict):
    response = client.post(
        f"{settings.API_V1_STR}/orders/", headers=normal_user_token_headers
    )
    assert response.status_code == 400
    assert "Your cart is empty" in response.json()["detail"]


def test_read_orders_for_user(client: TestClient, normal_user_token_headers: dict, test_user: User, test_product: Product):
    # Place an order first
    client.post(f"{settings.API_V1_STR}/carts/items", headers=normal_user_token_headers, json={"product_id": test_product.id, "quantity": 1})
    client.post(f"{settings.API_V1_STR}/orders/", headers=normal_user_token_headers)

    response = client.get(
        f"{settings.API_V1_STR}/orders/", headers=normal_user_token_headers
    )
    assert response.status_code == 200
    orders = response.json()
    assert isinstance(orders, list)
    assert len(orders) >= 1
    assert all(order["user_id"] == test_user.id for order in orders)


def test_read_all_orders_superuser(client: TestClient, superuser_token_headers: dict, normal_user_token_headers: dict, test_user: User, test_product: Product, superuser: User):
    # Ensure superuser also has an order
    client.post(f"{settings.API_V1_STR}/carts/items", headers=superuser_token_headers, json={"product_id": test_product.id, "quantity": 1})
    client.post(f"{settings.API_V1_STR}/orders/", headers=superuser_token_headers)
    
    # And normal user has an order
    client.post(f"{settings.API_V1_STR}/carts/items", headers=normal_user_token_headers, json={"product_id": test_product.id, "quantity": 1})
    client.post(f"{settings.API_V1_STR}/orders/", headers=normal_user_token_headers)

    response = client.get(
        f"{settings.API_V1_STR}/orders/", headers=superuser_token_headers
    )
    assert response.status_code == 200
    orders = response.json()
    assert isinstance(orders, list)
    assert len(orders) >= 2 # At least one from test_user, one from superuser
    assert any(order["user_id"] == test_user.id for order in orders)
    assert any(order["user_id"] == superuser.id for order in orders)


def test_read_order_by_id_owner(client: TestClient, normal_user_token_headers: dict, test_user: User, test_product: Product):
    client.post(f"{settings.API_V1_STR}/carts/items", headers=normal_user_token_headers, json={"product_id": test_product.id, "quantity": 1})
    create_order_response = client.post(f"{settings.API_V1_STR}/orders/", headers=normal_user_token_headers)
    order_id = create_order_response.json()["id"]

    response = client.get(
        f"{settings.API_V1_STR}/orders/{order_id}", headers=normal_user_token_headers
    )
    assert response.status_code == 200
    order = response.json()
    assert order["id"] == order_id
    assert order["user_id"] == test_user.id


def test_read_order_by_id_superuser(client: TestClient, superuser_token_headers: dict, normal_user_token_headers: dict, test_user: User, test_product: Product):
    client.post(f"{settings.API_V1_STR}/carts/items", headers=normal_user_token_headers, json={"product_id": test_product.id, "quantity": 1})
    create_order_response = client.post(f"{settings.API_V1_STR}/orders/", headers=normal_user_token_headers)
    order_id = create_order_response.json()["id"]

    response = client.get(
        f"{settings.API_V1_STR}/orders/{order_id}", headers=superuser_token_headers
    )
    assert response.status_code == 200
    order = response.json()
    assert order["id"] == order_id


def test_read_order_by_id_other_user_forbidden(client: TestClient, normal_user_token_headers: dict, superuser_token_headers: dict, test_user: User, test_product: Product):
    # Create an order with superuser
    client.post(f"{settings.API_V1_STR}/carts/items", headers=superuser_token_headers, json={"product_id": test_product.id, "quantity": 1})
    create_order_response = client.post(f"{settings.API_V1_STR}/orders/", headers=superuser_token_headers)
    superuser_order_id = create_order_response.json()["id"]

    # Try to access superuser's order with normal user token
    response = client.get(
        f"{settings.API_V1_STR}/orders/{superuser_order_id}", headers=normal_user_token_headers
    )
    assert response.status_code == 403


def test_update_order_status_superuser(client: TestClient, superuser_token_headers: dict, normal_user_token_headers: dict, test_user: User, test_product: Product):
    client.post(f"{settings.API_V1_STR}/carts/items", headers=normal_user_token_headers, json={"product_id": test_product.id, "quantity": 1})
    create_order_response = client.post(f"{settings.API_V1_STR}/orders/", headers=normal_user_token_headers)
    order_id = create_order_response.json()["id"]

    update_status_data = {"status": "shipped"}
    response = client.put(
        f"{settings.API_V1_STR}/orders/{order_id}/status", headers=superuser_token_headers, json=update_status_data
    )
    assert response.status_code == 200
    order = response.json()
    assert order["id"] == order_id
    assert order["status"] == update_status_data["status"]

def test_update_order_status_normal_user_forbidden(client: TestClient, normal_user_token_headers: dict, test_user: User, test_product: Product):
    client.post(f"{settings.API_V1_STR}/carts/items", headers=normal_user_token_headers, json={"product_id": test_product.id, "quantity": 1})
    create_order_response = client.post(f"{settings.API_V1_STR}/orders/", headers=normal_user_token_headers)
    order_id = create_order_response.json()["id"]

    update_status_data = {"status": "shipped"}
    response = client.put(
        f"{settings.API_V1_STR}/orders/{order_id}/status", headers=normal_user_token_headers, json=update_status_data
    )
    assert response.status_code == 403

```