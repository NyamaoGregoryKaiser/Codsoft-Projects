```python
import logging
from typing import List, Optional
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload, joinedload

from app.models.order import Order, OrderItem, CartItem
from app.models.product import Product
from app.schemas.order import OrderCreate
from app.schemas.product import ProductPublic
from app.schemas.order import CartItemPublic # For type hinting

logger = logging.getLogger("ecommerce_system")

# === CRUD for Cart Items ===

async def get_cart_item(db: AsyncSession, cart_item_id: int, user_id: int) -> Optional[CartItem]:
    """Retrieve a specific cart item for a user."""
    result = await db.execute(
        select(CartItem)
        .options(selectinload(CartItem.product))
        .filter(CartItem.id == cart_item_id, CartItem.user_id == user_id)
    )
    return result.scalar_one_or_none()

async def get_cart_items(db: AsyncSession, user_id: int) -> List[CartItem]:
    """Retrieve all cart items for a given user."""
    result = await db.execute(
        select(CartItem)
        .options(selectinload(CartItem.product))
        .filter(CartItem.user_id == user_id)
        .order_by(CartItem.created_at)
    )
    return result.scalars().all()

async def add_item_to_cart(db: AsyncSession, user_id: int, product_id: int, quantity: int) -> CartItem:
    """
    Adds an item to the cart or updates its quantity if it already exists.
    Performs stock validation.
    """
    if quantity <= 0:
        raise ValueError("Quantity must be positive.")

    # Check product existence and availability
    product = await db.scalar(select(Product).filter(Product.id == product_id, Product.is_available == True))
    if not product:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Product not found or not available.")
    
    existing_cart_item = await db.scalar(
        select(CartItem)
        .filter(CartItem.user_id == user_id, CartItem.product_id == product_id)
    )

    if existing_cart_item:
        new_quantity = existing_cart_item.quantity + quantity
        if new_quantity > product.stock_quantity:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Not enough stock. Only {product.stock_quantity} available.")
        existing_cart_item.quantity = new_quantity
        db.add(existing_cart_item)
        await db.commit()
        await db.refresh(existing_cart_item)
        logger.info(f"User {user_id} updated cart item for product {product_id} to {new_quantity}.")
        return existing_cart_item
    else:
        if quantity > product.stock_quantity:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Not enough stock. Only {product.stock_quantity} available.")
        new_cart_item = CartItem(user_id=user_id, product_id=product_id, quantity=quantity)
        db.add(new_cart_item)
        await db.commit()
        await db.refresh(new_cart_item)
        logger.info(f"User {user_id} added new cart item for product {product_id} with quantity {quantity}.")
        return new_cart_item

async def update_cart_item(db: AsyncSession, cart_item: CartItem, new_quantity: int) -> CartItem:
    """Updates the quantity of an existing cart item. Performs stock validation."""
    if new_quantity <= 0:
        await db.delete(cart_item)
        await db.commit()
        logger.info(f"Cart item {cart_item.id} (product {cart_item.product_id}) removed from cart as quantity set to 0.")
        return None # Indicate item was removed

    product = await db.scalar(select(Product).filter(Product.id == cart_item.product_id, Product.is_available == True))
    if not product:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Product not found or not available.")

    if new_quantity > product.stock_quantity:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Not enough stock. Only {product.stock_quantity} available.")

    cart_item.quantity = new_quantity
    db.add(cart_item)
    await db.commit()
    await db.refresh(cart_item)
    logger.info(f"Cart item {cart_item.id} updated to quantity {new_quantity}.")
    return cart_item

async def remove_item_from_cart(db: AsyncSession, cart_item_id: int, user_id: int) -> None:
    """Removes a specific cart item from a user's cart."""
    cart_item = await get_cart_item(db, cart_item_id, user_id)
    if cart_item:
        await db.delete(cart_item)
        await db.commit()
        logger.info(f"User {user_id} removed cart item {cart_item_id}.")
    else:
        logger.warning(f"Attempted to remove non-existent cart item {cart_item_id} for user {user_id}.")

async def clear_cart(db: AsyncSession, user_id: int) -> None:
    """Removes all items from a user's cart."""
    cart_items = await get_cart_items(db, user_id)
    for item in cart_items:
        await db.delete(item)
    await db.commit()
    logger.info(f"Cart cleared for user {user_id}.")


# === CRUD for Orders ===

async def get_order(db: AsyncSession, order_id: int) -> Optional[Order]:
    """Retrieve an order by its ID, eagerly loading user and order items."""
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.user), selectinload(Order.order_items).selectinload(OrderItem.product))
        .filter(Order.id == order_id)
    )
    return result.scalar_one_or_none()

async def get_user_orders(db: AsyncSession, user_id: int) -> List[Order]:
    """Retrieve all orders for a specific user."""
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.order_items).selectinload(OrderItem.product))
        .filter(Order.user_id == user_id)
        .order_by(Order.order_date.desc())
    )
    return result.scalars().all()

async def get_orders(
    db: AsyncSession, 
    skip: int = 0, 
    limit: int = 100,
    status_filter: Optional[str] = None,
    user_id_filter: Optional[int] = None
) -> List[Order]:
    """Retrieve multiple orders with pagination and filters."""
    query = select(Order).options(selectinload(Order.user), selectinload(Order.order_items).selectinload(OrderItem.product))

    if status_filter:
        query = query.filter(Order.status == status_filter)
    if user_id_filter:
        query = query.filter(Order.user_id == user_id_filter)
    
    query = query.offset(skip).limit(limit).order_by(Order.order_date.desc())
    result = await db.execute(query)
    return result.scalars().all()

async def create_order(db: AsyncSession, order_in: OrderCreate) -> Order:
    """
    Creates a new order from a user's cart items.
    This function handles stock deduction and clearing the cart.
    """
    order_items_to_create = []
    total_amount = Decimal('0.00')
    
    # 1. Validate cart items and stock
    for cart_item_schema in order_in.cart_items: # cart_items is a list of CartItemPublic from API call
        product_id = cart_item_schema.product.id # Assuming CartItemPublic includes ProductPublic
        quantity = cart_item_schema.quantity
        
        product = await db.scalar(select(Product).filter(Product.id == product_id))
        if not product or not product.is_available:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Product '{cart_item_schema.product.name}' is not available.")
        if product.stock_quantity < quantity:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Insufficient stock for product '{product.name}'. Available: {product.stock_quantity}, Requested: {quantity}")

        # Store details for order item creation
        order_items_to_create.append({
            "product_id": product.id,
            "quantity": quantity,
            "price_at_purchase": product.price # Capture price at time of purchase
        })
        total_amount += product.price * quantity

    # 2. Create the order
    db_order = Order(
        user_id=order_in.user_id,
        shipping_address=order_in.shipping_address,
        total_amount=total_amount,
        status="pending", # Initial status
        payment_status="pending" # Initial payment status
    )
    db.add(db_order)
    await db.flush() # Flush to get the order ID before creating order items

    # 3. Create order items and deduct stock
    for item_data in order_items_to_create:
        db_order_item = OrderItem(order_id=db_order.id, **item_data)
        db.add(db_order_item)
        
        # Deduct stock
        product = await db.scalar(select(Product).filter(Product.id == item_data["product_id"])) # Re-fetch product to ensure it's tracked
        if product:
            product.stock_quantity -= item_data["quantity"]
            if product.stock_quantity < 0: # Double check, should be caught by earlier validation
                raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Negative stock detected after deduction.")
            if product.stock_quantity == 0:
                product.is_available = False # Mark as unavailable if stock hits zero
            db.add(product) # Mark product for update

    # 4. Clear the user's cart
    await clear_cart(db, order_in.user_id)

    await db.commit()
    await db.refresh(db_order) # Refresh to load relationships like order_items
    logger.info(f"Order created for user {order_in.user_id} with ID: {db_order.id}. Total: {total_amount}")
    return db_order

async def update_order_status(db: AsyncSession, order: Order, new_status: str) -> Order:
    """Updates the status of an existing order."""
    order.status = new_status
    db.add(order)
    await db.commit()
    await db.refresh(order)
    logger.info(f"Order {order.id} status updated to {new_status}.")
    return order

async def delete_order(db: AsyncSession, order_id: int) -> None:
    """Deletes an order by its ID."""
    order = await get_order(db, order_id)
    if order:
        # Cascade delete is configured in models, so order items will be deleted automatically
        await db.delete(order)
        await db.commit()
        logger.info(f"Order deleted: ID {order_id}")
    else:
        logger.warning(f"Attempted to delete non-existent order: ID {order_id}")

```