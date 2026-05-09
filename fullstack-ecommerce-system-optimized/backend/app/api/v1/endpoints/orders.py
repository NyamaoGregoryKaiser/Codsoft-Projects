```python
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, get_current_active_user, get_current_active_superuser
from app.crud.cart import crud_cart
from app.crud.order import crud_order
from app.crud.product import crud_product
from app.schemas.order import OrderCreate, OrderPublic, OrderStatusUpdate
from app.schemas.user import UserPublic
from app.core.logging_config import setup_logging

router = APIRouter()
logger = setup_logging(__name__)

@router.post("/", response_model=OrderPublic, status_code=status.HTTP_201_CREATED)
def create_order(
    db: Session = Depends(get_db),
    current_user: UserPublic = Depends(get_current_active_user),
):
    """
    Place a new order from the current user's cart.
    Clears the cart upon successful order creation.
    """
    cart = crud_cart.get_by_user_id(db, user_id=current_user.id)
    if not cart or not cart.items:
        logger.warning(f"User {current_user.email} attempted to place an order with an empty or non-existent cart.")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your cart is empty. Add items before placing an order."
        )

    # Check product availability (simple stock check)
    for cart_item in cart.items:
        product = crud_product.get(db, id=cart_item.product_id)
        if not product or product.stock < cart_item.quantity:
            logger.warning(f"Order failed for user {current_user.email}: Product '{product.name}' (ID: {product.id}) is out of stock or insufficient quantity.")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product '{product.name}' is out of stock or insufficient quantity."
            )

    order_in = OrderCreate(
        user_id=current_user.id,
        order_items=[
            {"product_id": item.product_id, "quantity": item.quantity, "price_at_order": item.product.price}
            for item in cart.items
        ]
    )

    order = crud_order.create(db, obj_in=order_in)

    # Decrease stock and clear cart
    for cart_item in cart.items:
        product = crud_product.get(db, id=cart_item.product_id)
        crud_product.update(db, db_obj=product, obj_in={"stock": product.stock - cart_item.quantity})
    crud_cart.clear_cart(db, user_id=current_user.id)

    logger.info(f"User {current_user.email} placed order ID {order.id}.")
    return order


@router.get("/", response_model=List[OrderPublic])
def read_orders(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: UserPublic = Depends(get_current_active_user),
):
    """
    Retrieve orders for the current user. Superusers can retrieve all orders.
    """
    if crud_user.is_superuser(current_user):
        orders = crud_order.get_multi(db, skip=skip, limit=limit)
        logger.info(f"Superuser {current_user.email} retrieved all orders.")
    else:
        orders = crud_order.get_multi_by_user(db, user_id=current_user.id, skip=skip, limit=limit)
        logger.info(f"User {current_user.email} retrieved their own orders.")
    return orders


@router.get("/{order_id}", response_model=OrderPublic)
def read_order_by_id(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: UserPublic = Depends(get_current_active_user),
):
    """
    Get a specific order by ID.
    Accessible by the order's owner or a superuser.
    """
    order = crud_order.get(db, id=order_id)
    if not order:
        logger.warning(f"Order with ID {order_id} not found for user {current_user.email}.")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Order not found"
        )
    if not crud_user.is_superuser(current_user) and order.user_id != current_user.id:
        logger.warning(f"User {current_user.email} attempted to access order ID {order_id} which they do not own.")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this order"
        )
    logger.info(f"User {current_user.email} accessed order ID {order_id}.")
    return order


@router.put("/{order_id}/status", response_model=OrderPublic)
def update_order_status(
    *,
    db: Session = Depends(get_db),
    order_id: int,
    status_update: OrderStatusUpdate,
    current_user: UserPublic = Depends(get_current_active_superuser), # Only superusers can update status
):
    """
    Update the status of an order. Accessible only by superusers.
    """
    order = crud_order.get(db, id=order_id)
    if not order:
        logger.warning(f"Superuser {current_user.email} attempted to update status of non-existent order ID {order_id}.")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Order not found"
        )
    order = crud_order.update(db, db_obj=order, obj_in={"status": status_update.status})
    logger.info(f"Superuser {current_user.email} updated status of order ID {order_id} to '{status_update.status}'.")
    return order

```