```python
from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field

from app.schemas.user import UserPublic
from app.schemas.product import ProductPublic

# --- Cart Item Schemas ---

class CartItemBase(BaseModel):
    product_id: int = Field(..., example=1)
    quantity: int = Field(..., gt=0, example=2)

class CartItemCreate(CartItemBase):
    pass # No extra fields for creation from user input

class CartItemUpdate(BaseModel):
    quantity: int = Field(..., ge=0, example=1) # Allow 0 to indicate removal

class CartItemPublic(CartItemBase):
    id: int = Field(..., example=1)
    user_id: int = Field(..., example=1)
    created_at: datetime = Field(..., example=datetime.now())
    updated_at: datetime = Field(..., example=datetime.now())
    
    product: ProductPublic # Include product details

    class Config:
        from_attributes = True

# --- Order Item Schemas ---

class OrderItemBase(BaseModel):
    product_id: int = Field(..., example=1)
    quantity: int = Field(..., gt=0, example=1)
    price_at_purchase: Decimal = Field(..., gt=0, decimal_places=2, example=49.99)

class OrderItemPublic(OrderItemBase):
    id: int = Field(..., example=1)
    order_id: int = Field(..., example=1)
    
    product: ProductPublic # Include product details

    class Config:
        from_attributes = True

# --- Order Schemas ---

class OrderBase(BaseModel):
    user_id: int = Field(..., example=1)
    status: str = Field("pending", example="pending") # e.g., pending, processing, shipped, delivered, cancelled
    total_amount: Decimal = Field(..., gt=0, decimal_places=2, example=129.98)
    shipping_address: Optional[str] = Field(None, example="123 Main St, Anytown, USA")
    payment_status: str = Field("pending", example="pending") # e.g., pending, paid, refunded

class OrderCreate(BaseModel):
    # When creating an order, the user provides the shipping address,
    # and the cart items are derived from their active cart.
    user_id: int = Field(..., example=1, description="ID of the user placing the order.")
    shipping_address: str = Field(..., example="123 Main St, Anytown, USA", min_length=10)
    
    # This field is for internal processing; it will be populated by the backend's CRUD layer
    # after retrieving the user's actual cart.
    # It allows us to reuse existing cart item logic within the order creation.
    cart_items: List[CartItemPublic] = Field(default_factory=list, exclude=True) # Exclude from schema for API input/output

class OrderPublic(OrderBase):
    id: int = Field(..., example=1)
    order_date: datetime = Field(..., example=datetime.now())
    created_at: datetime = Field(..., example=datetime.now())
    updated_at: datetime = Field(..., example=datetime.now())
    
    user: UserPublic # Include user details
    order_items: List[OrderItemPublic] = Field(default_factory=list)

    class Config:
        from_attributes = True

```