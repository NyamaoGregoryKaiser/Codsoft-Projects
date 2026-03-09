```python
from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field, HttpUrl

# --- Category Schemas ---

class CategoryBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, example="Electronics")
    description: Optional[str] = Field(None, max_length=500, example="Gadgets, computers, and accessories.")

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(CategoryBase):
    name: Optional[str] = Field(None, min_length=2, max_length=100)

class CategoryPublic(CategoryBase):
    id: int = Field(..., example=1)

    class Config:
        from_attributes = True

# --- Product Schemas ---

class ProductBase(BaseModel):
    name: str = Field(..., min_length=3, max_length=200, example="Smartphone X")
    description: Optional[str] = Field(None, max_length=1000, example="Latest model smartphone with AI camera and long battery life.")
    price: Decimal = Field(..., gt=0, decimal_places=2, example=499.99)
    stock_quantity: int = Field(..., ge=0, example=50)
    category_id: Optional[int] = Field(None, example=1)
    image_url: Optional[HttpUrl] = Field(None, example="http://example.com/images/smartphone-x.jpg")
    is_available: bool = Field(True, example=True)

class ProductCreate(ProductBase):
    pass

class ProductUpdate(ProductBase):
    name: Optional[str] = Field(None, min_length=3, max_length=200)
    price: Optional[Decimal] = Field(None, gt=0, decimal_places=2)
    stock_quantity: Optional[int] = Field(None, ge=0)
    is_available: Optional[bool] = Field(None)

class ProductPublic(ProductBase):
    id: int = Field(..., example=1)
    created_at: datetime = Field(..., example=datetime.now())
    updated_at: datetime = Field(..., example=datetime.now())
    
    # Nested category information
    category: Optional[CategoryPublic] = None

    class Config:
        from_attributes = True

```