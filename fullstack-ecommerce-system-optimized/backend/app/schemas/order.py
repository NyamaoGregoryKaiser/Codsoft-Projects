```python
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class OrderItemBase(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)
    price_at_order: float = Field(..., gt=0) # Price at the time of order


class OrderItemCreate(OrderItemBase):
    pass


class OrderItemPublic(OrderItemBase):
    id: int
    order_id: int
    # Eagerly load product info
    product: ProductPublic # Assuming product info is needed when viewing order
    
    model_config = {
        "from_attributes": True
    }


class OrderBase(BaseModel):
    user_id: int
    total_amount: float = Field(..., ge=0)
    status: str = "pending" # e.g., pending, processing, shipped, delivered, cancelled
    shipping_address: Optional[str] = None
    payment_status: str = "unpaid" # e.g., unpaid, paid, refunded


class OrderCreate(BaseModel):
    user_id: int
    order_items: List[OrderItemCreate] # Items passed directly for order creation


class OrderStatusUpdate(BaseModel):
    status: str = Field(..., description="New status for the order, e.g., 'processing', 'shipped', 'delivered', 'cancelled'")


class OrderPublic(OrderBase):
    id: int
    order_date: datetime
    items: List[OrderItemPublic] = [] # List of items in this order

    model_config = {
        "from_attributes": True
    }

```