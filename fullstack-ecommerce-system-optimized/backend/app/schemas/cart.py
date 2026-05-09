```python
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from app.schemas.product import ProductPublic


class CartItemBase(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0) # Quantity must be positive


class CartItemCreate(CartItemBase):
    pass


class CartUpdateItemQuantity(BaseModel):
    quantity: int = Field(..., ge=0) # Quantity can be 0 to remove item


class CartItemPublic(CartItemBase):
    id: int
    cart_id: int
    # Eagerly load product info
    product: ProductPublic 
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }


class CartPublic(BaseModel):
    id: int
    user_id: int
    items: List[CartItemPublic] = []
    total_items: int
    total_amount: float
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }

```