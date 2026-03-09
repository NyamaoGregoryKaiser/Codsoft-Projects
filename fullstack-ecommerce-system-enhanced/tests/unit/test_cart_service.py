```python
import pytest
from decimal import Decimal
from unittest.mock import AsyncMock, patch

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.services.cart_service import CartService
from app.models.product import Product, Category
from app.models.order import CartItem
from app.schemas.order import CartItemCreate, CartItemUpdate
from app.schemas.product import ProductPublic

@pytest.mark.asyncio
async def test_get_user_cart_items_empty(db_session: AsyncSession):
    service = CartService(db_session)
    cart_items = await service.get_user_cart_items(user_id=1)
    assert cart_items == []

@pytest.mark.asyncio
async def test_get_user_cart_items_with_items(db_session: AsyncSession):
    # Setup: create user, product, and cart items
    user_id = 1
    category = Category(name="TestCat")
    db_session.add(category)
    await db_session.flush()

    product1 = Product(name="Test Prod 1", price=Decimal("10.00"), stock_quantity=10, is_available=True, category_id=category.id)
    product2 = Product(name="Test Prod 2", price=Decimal("20.00"), stock_quantity=5, is_available=True, category_id=category.id)
    db_session.add_all([product1, product2])
    await db_session.flush()

    cart_item1 = CartItem(user_id=user_id, product_id=product1.id, quantity=1)
    cart_item2 = CartItem(user_id=user_id, product_id=product2.id, quantity=2)
    db_session.add_all([cart_item1, cart_item2])
    await db_session.commit()

    service = CartService(db_session)
    cart_items = await service.get_user_cart_items(user_id)

    assert len(cart_items) == 2
    assert cart_items[0].product.name == "Test Prod 1"
    assert cart_items[1].product.name == "Test Prod 2"
    assert cart_items[0].quantity == 1
    assert cart_items[1].quantity == 2

@pytest.mark.asyncio
async def test_add_or_update_cart_item_new(db_session: AsyncSession):
    user_id = 1
    category = Category(name="TestCat")
    db_session.add(category)
    await db_session.flush()
    product = Product(name="New Product", price=Decimal("10.00"), stock_quantity=10, is_available=True, category_id=category.id)
    db_session.add(product)
    await db_session.flush()

    service = CartService(db_session)
    item_in = CartItemCreate(product_id=product.id, quantity=3)
    cart_item = await service.add_or_update_cart_item(user_id, item_in)

    assert cart_item.product_id == product.id
    assert cart_item.quantity == 3
    
    # Verify in DB
    db_cart_item = await db_session.scalar(select(CartItem).filter(CartItem.user_id == user_id, CartItem.product_id == product.id))
    assert db_cart_item.quantity == 3

@pytest.mark.asyncio
async def test_add_or_update_cart_item_update_quantity(db_session: AsyncSession):
    user_id = 1
    category = Category(name="TestCat")
    db_session.add(category)
    await db_session.flush()
    product = Product(name="Update Product", price=Decimal("10.00"), stock_quantity=10, is_available=True, category_id=category.id)
    db_session.add(product)
    await db_session.flush()

    existing_cart_item = CartItem(user_id=user_id, product_id=product.id, quantity=2)
    db_session.add(existing_cart_item)
    await db_session.flush()

    service = CartService(db_session)
    item_in = CartItemCreate(product_id=product.id, quantity=3)
    cart_item = await service.add_or_update_cart_item(user_id, item_in)

    assert cart_item.product_id == product.id
    assert cart_item.quantity == 5 # 2 (initial) + 3 (new)

    # Verify in DB
    db_cart_item = await db_session.scalar(select(CartItem).filter(CartItem.user_id == user_id, CartItem.product_id == product.id))
    assert db_cart_item.quantity == 5

@pytest.mark.asyncio
async def test_add_or_update_cart_item_insufficient_stock(db_session: AsyncSession):
    user_id = 1
    category = Category(name="TestCat")
    db_session.add(category)
    await db_session.flush()
    product = Product(name="Limited Stock", price=Decimal("5.00"), stock_quantity=5, is_available=True, category_id=category.id)
    db_session.add(product)
    await db_session.flush()

    service = CartService(db_session)
    item_in = CartItemCreate(product_id=product.id, quantity=10) # Requesting more than available

    with pytest.raises(HTTPException) as exc_info:
        await service.add_or_update_cart_item(user_id, item_in)
    
    assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
    assert "Not enough stock" in exc_info.value.detail

@pytest.mark.asyncio
async def test_add_or_update_cart_item_product_unavailable(db_session: AsyncSession):
    user_id = 1
    category = Category(name="TestCat")
    db_session.add(category)
    await db_session.flush()
    product = Product(name="Unavailable Prod", price=Decimal("1.00"), stock_quantity=1, is_available=False, category_id=category.id)
    db_session.add(product)
    await db_session.flush()

    service = CartService(db_session)
    item_in = CartItemCreate(product_id=product.id, quantity=1)

    with pytest.raises(HTTPException) as exc_info:
        await service.add_or_update_cart_item(user_id, item_in)
    
    assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
    assert "not found or not available" in exc_info.value.detail

@pytest.mark.asyncio
async def test_update_cart_item_quantity_success(db_session: AsyncSession):
    user_id = 1
    category = Category(name="TestCat")
    db_session.add(category)
    await db_session.flush()
    product = Product(name="Updatable Prod", price=Decimal("10.00"), stock_quantity=10, is_available=True, category_id=category.id)
    db_session.add(product)
    await db_session.flush()

    cart_item = CartItem(user_id=user_id, product_id=product.id, quantity=2)
    db_session.add(cart_item)
    await db_session.flush()

    service = CartService(db_session)
    item_in = CartItemUpdate(quantity=5)
    updated_cart_item = await service.update_cart_item_quantity(user_id, cart_item.id, item_in)

    assert updated_cart_item.quantity == 5
    db_item = await db_session.scalar(select(CartItem).filter(CartItem.id == cart_item.id))
    assert db_item.quantity == 5

@pytest.mark.asyncio
async def test_update_cart_item_quantity_remove_item(db_session: AsyncSession):
    user_id = 1
    category = Category(name="TestCat")
    db_session.add(category)
    await db_session.flush()
    product = Product(name="Removable Prod", price=Decimal("10.00"), stock_quantity=10, is_available=True, category_id=category.id)
    db_session.add(product)
    await db_session.flush()

    cart_item = CartItem(user_id=user_id, product_id=product.id, quantity=2)
    db_session.add(cart_item)
    await db_session.flush()

    service = CartService(db_session)
    item_in = CartItemUpdate(quantity=0)

    with pytest.raises(HTTPException) as exc_info:
        await service.update_cart_item_quantity(user_id, cart_item.id, item_in)
    
    assert exc_info.value.status_code == status.HTTP_200_OK
    assert "Item removed from cart." in exc_info.value.detail

    # Verify item is removed from DB
    db_item = await db_session.scalar(select(CartItem).filter(CartItem.id == cart_item.id))
    assert db_item is None

@pytest.mark.asyncio
async def test_update_cart_item_quantity_not_found(db_session: AsyncSession):
    service = CartService(db_session)
    item_in = CartItemUpdate(quantity=1)

    with pytest.raises(HTTPException) as exc_info:
        await service.update_cart_item_quantity(user_id=1, cart_item_id=999, item_in=item_in)
    
    assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND

@pytest.mark.asyncio
async def test_remove_cart_item_success(db_session: AsyncSession):
    user_id = 1
    category = Category(name="TestCat")
    db_session.add(category)
    await db_session.flush()
    product = Product(name="Remove Me", price=Decimal("10.00"), stock_quantity=10, is_available=True, category_id=category.id)
    db_session.add(product)
    await db_session.flush()

    cart_item = CartItem(user_id=user_id, product_id=product.id, quantity=1)
    db_session.add(cart_item)
    await db_session.flush()

    service = CartService(db_session)
    await service.remove_cart_item(user_id, cart_item.id)

    db_item = await db_session.scalar(select(CartItem).filter(CartItem.id == cart_item.id))
    assert db_item is None

@pytest.mark.asyncio
async def test_remove_cart_item_not_found(db_session: AsyncSession):
    service = CartService(db_session)
    with pytest.raises(HTTPException) as exc_info:
        await service.remove_cart_item(user_id=1, cart_item_id=999)
    assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND

@pytest.mark.asyncio
async def test_calculate_cart_total(db_session: AsyncSession):
    user_id = 1
    category = Category(name="TestCat")
    db_session.add(category)
    await db_session.flush()

    product1 = Product(name="Prod A", price=Decimal("10.50"), stock_quantity=10, is_available=True, category_id=category.id)
    product2 = Product(name="Prod B", price=Decimal("20.00"), stock_quantity=5, is_available=True, category_id=category.id)
    db_session.add_all([product1, product2])
    await db_session.flush()

    cart_item1 = CartItem(user_id=user_id, product_id=product1.id, quantity=2)
    cart_item2 = CartItem(user_id=user_id, product_id=product2.id, quantity=1)
    db_session.add_all([cart_item1, cart_item2])
    await db_session.commit()

    service = CartService(db_session)
    total = await service.calculate_cart_total(user_id)

    expected_total = (Decimal("10.50") * 2) + (Decimal("20.00") * 1)
    assert total == expected_total

@pytest.mark.asyncio
async def test_calculate_cart_total_empty_cart(db_session: AsyncSession):
    service = CartService(db_session)
    total = await service.calculate_cart_total(user_id=1)
    assert total == Decimal('0.00')

```