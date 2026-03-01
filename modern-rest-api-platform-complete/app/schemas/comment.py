from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

# Forward declaration for User to avoid circular import
class UserInComment(BaseModel):
    id: int
    email: str

    class Config:
        from_attributes = True


class CommentBase(BaseModel):
    content: str = Field(..., min_length=1, max_length=1000)

class CommentCreate(CommentBase):
    task_id: int

class CommentUpdate(CommentBase):
    content: Optional[str] = Field(None, min_length=1, max_length=1000)

class CommentInDBBase(CommentBase):
    id: int
    task_id: int
    author_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class Comment(CommentInDBBase):
    # Public facing comment schema
    author: UserInComment # Include author details
    pass

# Update forward reference for UserInComment
UserInComment.model_rebuild()
```