```python
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.crud.crud_order import get_cart_items, get_order, get_user_orders
from app.models.product import Product
from app.models.order import CartItem
from decimal import Decimal

@pytest.mark.asyncio
async def test_add_item_to_user_cart_new_item(client: AsyncClient, regular_user_token_headers: dict, seeded_db_session: AsyncSession):
    user_id = (await client.get("/api/v1/auth/me", headers=regular_user_token_headers)).json()["id"]
    product_id = 2 # Keyboard, stock 20
    item_in = {"product_id": product_id, "quantity": 3}

    response = await client.post("/api/v1/orders/cart", json=item_in, headers=regular_user_token_headers)
    assert response.status_code == 201
    cart_item = response.json()
    assert cart_item["user_id"] == user_id
    assert cart_item["product_id"] == product_id
    assert cart_item["quantity"] == 3

    db_cart_items = await get_cart_items(seeded_db_session, user_id)
    assert any(ci.product_id == product_id and ci.quantity == 3 for ci in db_cart_items)

@pytest.mark.asyncio
async def test_add_item_to_user_cart_update_existing_item(client: AsyncClient, regular_user_token_headers: dict, seeded_db_session: AsyncSession):
    user_id = (await client.get("/api/v1/auth/me", headers=regular_user_token_headers)).json()["id"]
    product_id = 1 # Laptop, stock 10
    
    # Item already in cart from seeded_db_session (quantity 1)
    
    item_in = {"product_id": product_id, "quantity": 2} # Add 2 more

    response = await client.post("/api/v1/orders/cart", json=item_in, headers=regular_user_token_headers)
    assert response.status_code == 201
    cart_item = response.json()
    assert cart_item["user_id"] == user_id
    assert cart_item["product_id"] == product_id
    assert cart_item["quantity"] == 3 # 1 (initial) + 2 (added)

    db_cart_items = await get_cart_items(seeded_db_session, user_id)
    assert any(ci.product_id == product_id and ci.quantity == 3 for ci in db_cart_items)

@pytest.mark.asyncio
async def test_add_item_to_user_cart_insufficient_stock(client: AsyncClient, regular_user_token_headers: dict, seeded_db_session: AsyncSession):
    product_id = 1 # Laptop, stock 10
    item_in = {"product_id": product_id, "quantity": 100} # Requesting more than available

    response = await client.post("/api/v1/orders/cart", json=item_in, headers=regular_user_token_headers)
    assert response.status_code == 400
    assert "Not enough stock" in response.json()["detail"]

@pytest.mark.asyncio
async def test_get_user_cart(client: AsyncClient, regular_user_token_headers: dict, seeded_db_session: AsyncSession):
    user_id = (await client.get("/api/v1/auth/me", headers=regular_user_token_headers)).json()["id"]

    response = await client.get("/api/v1/orders/cart", headers=regular_user_token_headers)
    assert response.status_code == 200
    cart_items = response.json()
    assert isinstance(cart_items, list)
    assert len(cart_items) >= 2 # From seeded_db_session (Laptop, Novel)
    assert any(ci["product"]["name"] == "Laptop" for ci in cart_items)

@pytest.mark.asyncio
async def test_update_user_cart_item(client: AsyncClient, regular_user_token_headers: dict, seeded_db_session: AsyncSession):
    user_id = (await client.get("/api/v1/auth/me", headers=regular_user_token_headers)).json()["id"]
    
    # Get a cart item ID for the user
    db_cart_items = await get_cart_items(seeded_db_session, user_id)
    cart_item_id = next(ci.id for ci in db_cart_items if ci.product.name == "Laptop") # Assuming Laptop is product_id 1
    
    update_in = {"quantity": 5}

    response = await client.put(f"/api/v1/orders/cart/{cart_item_id}", json=update_in, headers=regular_user_token_headers)
    assert response.status_code == 200
    updated_cart_item = response.json()
    assert updated_cart_item["id"] == cart_item_id
    assert updated_cart_item["quantity"] == 5

    db_cart_item = await seeded_db_session.scalar(
        seeded_db_session.query(CartItem)
        .filter(CartItem.id == cart_item_id)
        .subquery()
        .select()
    )
    assert db_cart_item.quantity == 5


@pytest.mark.asyncio
async def test_remove_user_cart_item(client: AsyncClient, regular_user_token_headers: dict, seeded_db_session: AsyncSession):
    user_id = (await client.get("/api/v1/auth/me", headers=regular_user_token_headers)).json()["id"]
    
    db_cart_items = await get_cart_items(seeded_db_session, user_id)
    cart_item_id = next(ci.id for ci in db_cart_items if ci.product.name == "Laptop")

    response = await client.delete(f"/api/v1/orders/cart/{cart_item_id}", headers=regular_user_token_headers)
    assert response.status_code == 204
    assert response.content == b""

    db_cart_items_after_delete = await get_cart_items(seeded_db_session, user_id)
    assert not any(ci.id == cart_item_id for ci in db_cart_items_after_delete)

@pytest.mark.asyncio
async def test_checkout_user_cart_success(client: AsyncClient, regular_user_token_headers: dict, seeded_db_session: AsyncSession):
    user_id = (await client.get("/api/v1/auth/me", headers=regular_user_token_headers)).json()["id"]
    shipping_address = "456 Test Lane, Unit Test City"
    
    # Cart is already populated from seeded_db_session
    initial_cart_items = await get_cart_items(seeded_db_session, user_id)
    assert len(initial_cart_items) > 0

    response = await client.post(f"/api/v1/orders/checkout?shipping_address={shipping_address}", headers=regular_user_token_headers)
    assert response.status_code == 201
    order = response.json()
    assert order["user_id"] == user_id
    assert order["shipping_address"] == shipping_address
    assert order["status"] == "pending"
    assert len(order["order_items"]) == len(initial_cart_items)
    assert order["total_amount"] == str(sum(Decimal(item["product"]["price"]) * item["quantity"] for item in order["order_items"]))

    # Verify cart is cleared
    remaining_cart_items = await get_cart_items(seeded_db_session, user_id)
    assert len(remaining_cart_items) == 0

    # Verify product stock deduction
    for item in initial_cart_items:
        product_db = await seeded_db_session.scalar(
            seeded_db_session.query(Product)
            .filter(Product.id == item.product_id)
            .subquery()
            .select()
        )
        assert product_db.stock_quantity == item.product.stock_quantity - item.quantity

@pytest.mark.asyncio
async def test_checkout_user_cart_empty_cart(client: AsyncClient, regular_user_token_headers: dict, seeded_db_session: AsyncSession):
    user_id = (await client.get("/api/v1/auth/me", headers=regular_user_token_headers)).json()["id"]
    
    # Clear cart first
    for item in await get_cart_items(seeded_db_session, user_id):
        await seeded_db_session.delete(item)
    await seeded_db_session.commit()

    response = await client.post("/api/v1/orders/checkout?shipping_address=SomeAddress", headers=regular_user_token_headers)
    assert response.status_code == 400
    assert "Cart is empty, cannot checkout." in response.json()["detail"]

@pytest.mark.asyncio
async def test_get_current_user_orders(client: AsyncClient, regular_user_token_headers: dict, seeded_db_session: AsyncSession):
    # One order is created for the regular user in seeded_db_session
    response = await client.get("/api/v1/orders/me/orders", headers=regular_user_token_headers)
    assert response.status_code == 200
    orders = response.json()
    assert isinstance(orders, list)
    assert len(orders) >= 1
    assert all(o["user"]["email"] == "test_user@example.com" for o in orders)

@pytest.mark.asyncio
async def test_get_order_by_id_as_self(client: AsyncClient, regular_user_token_headers: dict, seeded_db_session: AsyncSession):
    user_id = (await client.get("/api/v1/auth/me", headers=regular_user_token_headers)).json()["id"]
    orders = await get_user_orders(seeded_db_session, user_id)
    order_id = orders[0].id

    response = await client.get(f"/api/v1/orders/{order_id}", headers=regular_user_token_headers)
    assert response.status_code == 200
    order_data = response.json()
    assert order_data["id"] == order_id
    assert order_data["user"]["id"] == user_id

@pytest.mark.asyncio
async def test_get_order_by_id_as_admin(client: AsyncClient, admin_token_headers: dict, seeded_db_session: AsyncSession):
    regular_user_id = (await client.get("/api/v1/auth/me", headers=regular_user_token_headers)).json()["id"]
    orders = await get_user_orders(seeded_db_session, regular_user_id)
    order_id = orders[0].id

    response = await client.get(f"/api/v1/orders/{order_id}", headers=admin_token_headers)
    assert response.status_code == 200
    order_data = response.json()
    assert order_data["id"] == order_id
    assert order_data["user"]["id"] == regular_user_id

@pytest.mark.asyncio
async def test_get_order_by_id_forbidden_other_user(client: AsyncClient, regular_user_token_headers: dict, admin_token_headers: dict, seeded_db_session: AsyncSession):
    admin_id = (await client.get("/api/v1/auth/me", headers=admin_token_headers)).json()["id"]
    
    # Create an order for admin user
    product_for_admin = await seeded_db_session.scalar(seeded_db_session.query(Product).filter_by(name="Laptop").subquery().select())
    cart_item_admin = CartItem(user_id=admin_id, product_id=product_for_admin.id, quantity=1)
    seeded_db_session.add(cart_item_admin)
    await seeded_db_session.flush() # Ensure cart item gets ID for checkout
    
    admin_checkout_response = await client.post(f"/api/v1/orders/checkout?shipping_address=AdminAddress", headers=admin_token_headers)
    admin_order_id = admin_checkout_response.json()["id"]

    response = await client.get(f"/api/v1/orders/{admin_order_id}", headers=regular_user_token_headers)
    assert response.status_code == 403
    assert "Not authorized to access this order" in response.json()["detail"]

@pytest.mark.asyncio
async def test_get_all_orders_as_admin(client: AsyncClient, admin_token_headers: dict, seeded_db_session: AsyncSession):
    # Orders from seeded_db_session + potentially admin-created orders
    response = await client.get("/api/v1/orders/", headers=admin_token_headers)
    assert response.status_code == 200
    orders = response.json()
    assert isinstance(orders, list)
    assert len(orders) >= 1

@pytest.mark.asyncio
async def test_update_order_status_as_admin(client: AsyncClient, admin_token_headers: dict, seeded_db_session: AsyncSession):
    regular_user_id = (await client.get("/api/v1/auth/me", headers=regular_user_token_headers)).json()["id"]
    orders = await get_user_orders(seeded_db_session, regular_user_id)
    order_id = orders[0].id

    new_status = "shipped"
    response = await client.patch(f"/api/v1/orders/{order_id}/status?status_update={new_status}", headers=admin_token_headers)
    assert response.status_code == 200
    updated_order = response.json()
    assert updated_order["id"] == order_id
    assert updated_order["status"] == new_status

    db_order = await get_order(seeded_db_session, order_id)
    assert db_order.status == new_status

@pytest.mark.asyncio
async def test_delete_order_as_admin(client: AsyncClient, admin_token_headers: dict, seeded_db_session: AsyncSession):
    regular_user_id = (await client.get("/api/v1/auth/me", headers=regular_user_token_headers)).json()["id"]
    orders = await get_user_orders(seeded_db_session, regular_user_id)
    order_id = orders[0].id

    response = await client.delete(f"/api/v1/orders/{order_id}", headers=admin_token_headers)
    assert response.status_code == 204
    assert response.content == b""

    db_order = await get_order(seeded_db_session, order_id)
    assert db_order is None

```