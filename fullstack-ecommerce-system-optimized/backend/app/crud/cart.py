```python
from typing import Optional, List

from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from app.crud.base import CRUDBase
from app.db.models import Cart, CartItem, Product
from app.schemas.cart import CartItemCreate, CartPublic # CartItemUpdate is handled directly by quantity
from app.core.logging_config import setup_logging

logger = setup_logging(__name__)

class CRUDCart(CRUDBase[Cart, CartPublic, dict]): # CartPublic for read, dict for generic updates if needed
    def get_by_user_id(self, db: Session, *, user_id: int) -> Optional[Cart]:
        return (
            db.query(self.model)
            .options(joinedload(Cart.items).joinedload(CartItem.product))
            .filter(self.model.user_id == user_id)
            .first()
        )

    def get_or_create_cart(self, db: Session, *, user_id: int) -> Cart:
        cart = self.get_by_user_id(db, user_id=user_id)
        if not cart:
            cart = Cart(user_id=user_id)
            db.add(cart)
            db.commit()
            db.refresh(cart)
            logger.info(f"Created new cart for user ID: {user_id}")
        return cart

    def add_item(self, db: Session, *, user_id: int, product_id: int, quantity: int) -> Cart:
        cart = self.get_or_create_cart(db, user_id=user_id)
        cart_item = (
            db.query(CartItem)
            .filter(CartItem.cart_id == cart.id, CartItem.product_id == product_id)
            .first()
        )
        if cart_item:
            cart_item.quantity += quantity
            logger.info(f"Updated quantity for product {product_id} in cart {cart.id} to {cart_item.quantity}")
        else:
            cart_item = CartItem(cart_id=cart.id, product_id=product_id, quantity=quantity)
            db.add(cart_item)
            logger.info(f"Added product {product_id} with quantity {quantity} to cart {cart.id}")
        db.commit()
        db.refresh(cart) # Refresh to get updated items and total
        return cart

    def update_item_quantity(self, db: Session, *, user_id: int, product_id: int, quantity: int) -> Optional[Cart]:
        cart = self.get_by_user_id(db, user_id=user_id)
        if not cart:
            return None
        
        cart_item = (
            db.query(CartItem)
            .filter(CartItem.cart_id == cart.id, CartItem.product_id == product_id)
            .first()
        )

        if not cart_item:
            return None # Item not in cart

        if quantity <= 0:
            db.delete(cart_item)
            logger.info(f"Removed product {product_id} from cart {cart.id} (quantity was {quantity})")
        else:
            cart_item.quantity = quantity
            logger.info(f"Updated product {product_id} quantity in cart {cart.id} to {quantity}")
        
        db.commit()
        db.refresh(cart)
        return cart

    def remove_item(self, db: Session, *, user_id: int, product_id: int) -> Optional[Cart]:
        cart = self.get_by_user_id(db, user_id=user_id)
        if not cart:
            return None
        
        cart_item = (
            db.query(CartItem)
            .filter(CartItem.cart_id == cart.id, CartItem.product_id == product_id)
            .first()
        )
        if cart_item:
            db.delete(cart_item)
            db.commit()
            db.refresh(cart)
            logger.info(f"Removed product {product_id} from cart {cart.id}")
        return cart
    
    def clear_cart(self, db: Session, *, user_id: int) -> Optional[Cart]:
        cart = self.get_by_user_id(db, user_id=user_id)
        if cart:
            db.query(CartItem).filter(CartItem.cart_id == cart.id).delete()
            db.commit()
            db.refresh(cart) # Refresh to update items list and total
            logger.info(f"Cleared cart {cart.id} for user ID {user_id}")
        return cart


crud_cart = CRUDCart(Cart)

```