```python
import logging
from typing import List
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.crud.crud_order import get_cart_items, add_item_to_cart, update_cart_item, remove_item_from_cart
from app.crud.crud_product import get_product
from app.schemas.order import CartItemPublic, CartItemCreate, CartItemUpdate

logger = logging.getLogger("ecommerce_system")

class CartService:
    """
    Service layer for shopping cart operations.
    Encapsulates business logic related to cart management, stock checks, etc.
    """

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_user_cart_items(self, user_id: int) -> List[CartItemPublic]:
        """
        Retrieves all cart items for a given user.
        """
        db_cart_items = await get_cart_items(self.db, user_id)
        return [CartItemPublic.model_validate(item) for item in db_cart_items]

    async def add_or_update_cart_item(self, user_id: int, item_in: CartItemCreate) -> CartItemPublic:
        """
        Adds a new item to the cart or updates an existing one.
        Handles stock validation and business rules.
        """
        product = await get_product(self.db, item_in.product_id)
        if not product or not product.is_available:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product with ID {item_in.product_id} not found or not available."
            )
        
        # Add item_in.quantity to existing quantity if item already in cart
        existing_cart_item = await self.db.scalar(
            select(self.db.query(CartItem)
                   .filter(CartItem.user_id == user_id, CartItem.product_id == item_in.product_id)
                   .limit(1)
                   .subquery()
                   .select()) # Subquery to avoid type issues with `select`
        )
        
        current_quantity = existing_cart_item.quantity if existing_cart_item else 0
        requested_total_quantity = current_quantity + item_in.quantity

        if requested_total_quantity > product.stock_quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Not enough stock for product '{product.name}'. Available: {product.stock_quantity}, current in cart: {current_quantity}, requested: {item_in.quantity}"
            )
        
        db_cart_item = await add_item_to_cart(self.db, user_id, item_in.product_id, item_in.quantity)
        return CartItemPublic.model_validate(db_cart_item)

    async def update_cart_item_quantity(self, user_id: int, cart_item_id: int, item_in: CartItemUpdate) -> CartItemPublic:
        """
        Updates the quantity of a specific cart item.
        Handles stock validation and business rules.
        If new_quantity is 0, the item is removed.
        """
        db_cart_item = await get_cart_item(self.db, cart_item_id, user_id)
        if not db_cart_item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cart item not found."
            )

        if item_in.quantity == 0:
            await remove_item_from_cart(self.db, cart_item_id, user_id)
            raise HTTPException(status_code=status.HTTP_200_OK, detail="Item removed from cart.")

        product = await get_product(self.db, db_cart_item.product_id)
        if not product or not product.is_available:
             raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product '{product.name}' is no longer available."
            )

        if item_in.quantity > product.stock_quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Not enough stock for product '{product.name}'. Available: {product.stock_quantity}, requested: {item_in.quantity}"
            )

        updated_item = await update_cart_item(self.db, db_cart_item, item_in.quantity)
        return CartItemPublic.model_validate(updated_item)
    
    async def remove_cart_item(self, user_id: int, cart_item_id: int):
        """
        Removes a specific item from the cart.
        """
        db_cart_item = await get_cart_item(self.db, cart_item_id, user_id)
        if not db_cart_item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cart item not found."
            )
        await remove_item_from_cart(self.db, cart_item_id, user_id)

    async def calculate_cart_total(self, user_id: int) -> Decimal:
        """
        Calculates the total amount of all items in the user's cart.
        """
        cart_items = await get_cart_items(self.db, user_id)
        total = Decimal('0.00')
        for item in cart_items:
            # Ensure product details are loaded for price
            if item.product and item.product.price:
                total += item.product.price * item.quantity
            else:
                logger.warning(f"Product data missing for cart item {item.id}. Skipping from total calculation.")
        return total

```