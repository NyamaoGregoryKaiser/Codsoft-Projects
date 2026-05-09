```python
from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, Field


class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float = Field(..., gt=0) # Must be greater than 0
    stock: int = Field(0, ge=0) # Must be greater than or equal to 0
    image_url: Optional[str] = None
    category_id: Optional[int] = None


class ProductCreate(ProductBase):
    pass


class ProductUpdate(ProductBase):
    name: Optional[str] = None
    price: Optional[float] = Field(None, gt=0)
    stock: Optional[int] = Field(None, ge=0)


class ProductPublic(ProductBase):
    id: int
    owner_id: int
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }

```