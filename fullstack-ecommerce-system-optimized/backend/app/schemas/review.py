```python
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.schemas.user import UserPublic


class ReviewBase(BaseModel):
    product_id: int
    rating: int = Field(..., ge=1, le=5) # Rating between 1 and 5
    comment: Optional[str] = Field(None, max_length=1000)


class ReviewCreate(ReviewBase):
    pass


class ReviewUpdate(ReviewBase):
    rating: Optional[int] = Field(None, ge=1, le=5)
    comment: Optional[str] = Field(None, max_length=1000)


class ReviewPublic(ReviewBase):
    id: int
    user_id: int
    user: UserPublic # Eagerly load user for review
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }

```