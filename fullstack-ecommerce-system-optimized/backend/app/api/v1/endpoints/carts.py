```python
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, get_current_active_user
from app.crud.cart import crud_cart
from app.crud.product import crud_product
from app.schemas.cart import CartItemCreate, CartItemPublic, CartPublic, CartUpdateItemQuantity
from app.schemas.user import UserPublic
from app.core.logging_config import setup_logging

router = APIRouter()
logger = setup_logging(__name__)

@router.get("/", response_model=CartPublic)
def get_user_cart(
    db: Session = Depends(get_db),
    current_user: UserPublic = Depends(get_current_active_user),
):
    """
    Get the current user's shopping cart.
    If no cart exists, an empty one is created.
    """
    cart = crud_cart.get_or_create_cart(db, user_id=current_user.id)
    logger.info(f"User {current_user.email} retrieved their cart (ID: {cart.id}).")
    return cart


@router.post("/items", response_model=CartPublic, status_code=status.HTTP_200_OK)
def add_item_to_cart(
    *,
    db: Session = Depends(get_db),
    item_in: CartItemCreate,
    current_user: UserPublic = Depends(get_current_active_user),
):
    """
    Add a product to the current user's cart.
    Updates quantity if item already exists.
    """
    product = crud_product.get(db, id=item_in.product_id)
    if not product:
        logger.warning(f"User {current_user.email} attempted to add non-existent product ID {item_in.product_id} to cart.")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    if item_in.quantity <= 0:
        logger.warning(f"User {current_user.email} attempted to add product ID {item_in.product_id} with invalid quantity {item_in.quantity}.")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Quantity must be positive")

    cart = crud_cart.add_item(db, user_id=current_user.id, product_id=item_in.product_id, quantity=item_in.quantity)
    logger.info(f"User {current_user.email} added/updated product ID {item_in.product_id} in cart (ID: {cart.id}).")
    return cart


@router.put("/items/{product_id}", response_model=CartPublic)
def update_cart_item_quantity(
    *,
    db: Session = Depends(get_db),
    product_id: int,
    item_update: CartUpdateItemQuantity,
    current_user: UserPublic = Depends(get_current_active_user),
):
    """
    Update the quantity of a product in the current user's cart.
    If quantity is 0 or less, the item is removed.
    """
    product = crud_product.get(db, id=product_id)
    if not product:
        logger.warning(f"User {current_user.email} attempted to update quantity for non-existent product ID {product_id} in cart.")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    cart = crud_cart.update_item_quantity(db, user_id=current_user.id, product_id=product_id, quantity=item_update.quantity)
    if not cart:
        logger.warning(f"Cart or cart item not found for user {current_user.email} and product ID {product_id} during update.")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart or item not found")

    logger.info(f"User {current_user.email} updated product ID {product_id} quantity to {item_update.quantity} in cart (ID: {cart.id}).")
    return cart


@router.delete("/items/{product_id}", response_model=CartPublic)
def remove_item_from_cart(
    *,
    db: Session = Depends(get_db),
    product_id: int,
    current_user: UserPublic = Depends(get_current_active_user),
):
    """
    Remove a product from the current user's cart.
    """
    product = crud_product.get(db, id=product_id)
    if not product:
        logger.warning(f"User {current_user.email} attempted to remove non-existent product ID {product_id} from cart.")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    cart = crud_cart.remove_item(db, user_id=current_user.id, product_id=product_id)
    if not cart:
        logger.warning(f"Cart or cart item not found for user {current_user.email} and product ID {product_id} during removal.")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart or item not found")

    logger.info(f"User {current_user.email} removed product ID {product_id} from cart (ID: {cart.id}).")
    return cart


@router.post("/clear", response_model=CartPublic)
def clear_cart(
    db: Session = Depends(get_db),
    current_user: UserPublic = Depends(get_current_active_user),
):
    """
    Clear all items from the current user's cart.
    """
    cart = crud_cart.clear_cart(db, user_id=current_user.id)
    if not cart:
        logger.warning(f"Attempted to clear non-existent cart for user {current_user.email}.")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart not found")
    logger.info(f"User {current_user.email} cleared their cart (ID: {cart.id}).")
    return cart

```