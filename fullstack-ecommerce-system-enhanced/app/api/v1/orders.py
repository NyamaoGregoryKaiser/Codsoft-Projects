```python
import logging
from typing import List, Annotated, Optional
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.order import OrderPublic, OrderCreate, OrderUpdate, CartItemPublic, CartItemCreate, CartItemUpdate
from app.crud.crud_order import (
    get_cart_item, get_cart_items, add_item_to_cart, update_cart_item, remove_item_from_cart, clear_cart,
    get_order, get_orders, create_order, update_order_status, delete_order, get_user_orders
)
from app.crud.crud_product import get_product
from app.utils.dependencies import get_current_user, get_current_admin_user

logger = logging.getLogger("ecommerce_system")

router = APIRouter()

# === Cart Endpoints ===

@router.post("/cart", response_model=CartItemPublic, status_code=status.HTTP_201_CREATED)
async def add_item_to_user_cart(
    cart_item_in: CartItemCreate,
    current_user: Annotated[None, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """
    User: Adds an item to the current user's shopping cart or updates its quantity.
    """
    product = await get_product(db, cart_item_in.product_id)
    if not product or not product.is_available or product.stock_quantity < cart_item_in.quantity:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Product not available or insufficient stock")

    cart_item = await add_item_to_cart(db, current_user.id, cart_item_in.product_id, cart_item_in.quantity)
    logger.info(f"User {current_user.email} added/updated product {cart_item.product_id} in cart.")
    return cart_item

@router.get("/cart", response_model=List[CartItemPublic])
async def get_user_cart(
    current_user: Annotated[None, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """
    User: Retrieves all items in the current user's shopping cart.
    """
    cart_items = await get_cart_items(db, current_user.id)
    logger.debug(f"User {current_user.email} retrieved cart with {len(cart_items)} items.")
    return cart_items

@router.put("/cart/{cart_item_id}", response_model=CartItemPublic)
async def update_user_cart_item(
    cart_item_id: int,
    cart_item_in: CartItemUpdate,
    current_user: Annotated[None, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """
    User: Updates the quantity of a specific item in the current user's cart.
    """
    cart_item = await get_cart_item(db, cart_item_id, current_user.id)
    if not cart_item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart item not found")

    if cart_item_in.quantity <= 0:
        await remove_item_from_cart(db, cart_item_id, current_user.id)
        logger.info(f"User {current_user.email} removed product {cart_item.product_id} from cart (quantity 0).")
        raise HTTPException(status_code=status.HTTP_200_OK, detail="Item removed from cart.") # Or return an empty cart item public schema
        
    product = await get_product(db, cart_item.product_id)
    if not product or not product.is_available or product.stock_quantity < cart_item_in.quantity:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Product not available or insufficient stock for requested quantity")
    
    updated_cart_item = await update_cart_item(db, cart_item, cart_item_in.quantity)
    logger.info(f"User {current_user.email} updated quantity for cart item {cart_item_id}.")
    return updated_cart_item

@router.delete("/cart/{cart_item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_user_cart_item(
    cart_item_id: int,
    current_user: Annotated[None, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """
    User: Removes a specific item from the current user's cart.
    """
    cart_item = await get_cart_item(db, cart_item_id, current_user.id)
    if not cart_item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart item not found")
    
    await remove_item_from_cart(db, cart_item_id, current_user.id)
    logger.info(f"User {current_user.email} removed cart item {cart_item_id}.")
    return None

@router.post("/checkout", response_model=OrderPublic, status_code=status.HTTP_201_CREATED)
async def checkout_user_cart(
    shipping_address: str,
    current_user: Annotated[None, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """
    User: Creates an order from the current user's shopping cart.
    This process includes stock validation, order item creation, and clearing the cart.
    """
    cart_items = await get_cart_items(db, current_user.id)
    if not cart_items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cart is empty, cannot checkout.")

    order_create_data = OrderCreate(
        user_id=current_user.id,
        shipping_address=shipping_address,
        cart_items=cart_items # Pass existing cart items for processing
    )
    
    try:
        new_order = await create_order(db, order_create_data)
        logger.info(f"User {current_user.email} successfully checked out and created order {new_order.id}.")
        return new_order
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error during checkout for user {current_user.email}: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create order.")


# === Order Endpoints ===

@router.get("/me/orders", response_model=List[OrderPublic])
async def get_current_user_orders(
    current_user: Annotated[None, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """
    User: Retrieves all orders made by the current authenticated user.
    """
    orders = await get_user_orders(db, current_user.id)
    logger.debug(f"User {current_user.email} retrieved {len(orders)} orders.")
    return orders

@router.get("/{order_id}", response_model=OrderPublic)
async def get_order_by_id(
    order_id: int,
    current_user: Annotated[None, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """
    Admin: Retrieves any order by ID.
    User: Retrieves their own order by ID.
    """
    order = await get_order(db, order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    
    if order.user_id != current_user.id and not current_user.is_admin:
        logger.warning(f"User {current_user.email} attempted to access unauthorized order {order_id}.")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this order.")
    
    logger.debug(f"User {current_user.email} retrieved order {order_id}.")
    return order

@router.get("/", response_model=List[OrderPublic])
async def get_all_orders(
    skip: int = 0,
    limit: int = 100,
    status_filter: Optional[str] = Query(None, description="Filter orders by status (e.g., pending, delivered)"),
    user_id_filter: Optional[int] = Query(None, description="Filter orders by specific user ID (Admin only)"),
    current_admin: Annotated[None, Depends(get_current_admin_user)], # Requires admin
    db: AsyncSession = Depends(get_db)
):
    """
    Admin: Retrieves a list of all orders, with optional filtering.
    """
    orders = await get_orders(db, skip=skip, limit=limit, status_filter=status_filter, user_id_filter=user_id_filter)
    logger.debug(f"Admin {current_admin.email} retrieved {len(orders)} orders.")
    return orders

@router.patch("/{order_id}/status", response_model=OrderPublic)
async def update_order_status_endpoint(
    order_id: int,
    status_update: str, # Could be a Pydantic model with Enum for strict validation
    current_admin: Annotated[None, Depends(get_current_admin_user)], # Requires admin
    db: AsyncSession = Depends(get_db)
):
    """
    Admin: Updates the status of an order.
    Allowed statuses: pending, processing, shipped, delivered, cancelled.
    """
    order = await get_order(db, order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    allowed_statuses = ["pending", "processing", "shipped", "delivered", "cancelled"]
    if status_update.lower() not in allowed_statuses:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid status. Must be one of: {', '.join(allowed_statuses)}")

    updated_order = await update_order_status(db, order, status_update.lower())
    logger.info(f"Admin {current_admin.email} updated order {order_id} status to {status_update}.")
    return updated_order

@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_order_endpoint(
    order_id: int,
    current_admin: Annotated[None, Depends(get_current_admin_user)], # Requires admin
    db: AsyncSession = Depends(get_db)
):
    """
    Admin: Deletes an order. This action might have cascading effects on order items.
    """
    order = await get_order(db, order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    
    await delete_order(db, order_id)
    logger.info(f"Admin {current_admin.email} deleted order {order_id}.")
    return None

```