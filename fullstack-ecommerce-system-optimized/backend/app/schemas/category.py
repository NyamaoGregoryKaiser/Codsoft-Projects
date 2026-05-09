```python
from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel


class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(CategoryBase):
    name: Optional[str] = None # Allow partial updates for name


class CategoryPublic(CategoryBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }

```