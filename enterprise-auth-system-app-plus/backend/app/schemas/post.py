```python
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.schemas.user import UserPublic


class PostBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    content: str = Field(..., min_length=1)


class PostCreate(PostBase):
    pass


class PostUpdate(PostBase):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    content: Optional[str] = Field(None, min_length=1)


class PostInDBBase(PostBase):
    id: int
    owner_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class Post(PostInDBBase):
    owner: UserPublic  # Include owner's public profile

```