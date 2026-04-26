```python
from typing import Optional
from pydantic import BaseModel, Field

class ItemBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=256, example="Buy groceries")
    description: Optional[str] = Field(None, example="Milk, eggs, bread, and fruits")

class ItemCreate(ItemBase):
    pass

class ItemUpdate(ItemBase):
    is_completed: Optional[bool] = Field(None, example=True)

class ItemInDB(ItemBase):
    id: int
    owner_id: int
    is_completed: bool
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    class Config:
        orm_mode = True
```