```python
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class PaginatedResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: list

class DateTimeBase(BaseModel):
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
```