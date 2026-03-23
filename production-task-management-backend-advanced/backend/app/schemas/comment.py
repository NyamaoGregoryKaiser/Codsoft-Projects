from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.schemas.user import User
from app.schemas.task import TaskMinimal # Use minimal to avoid deep nesting

# Shared properties
class CommentBase(BaseModel):
    content: Optional[str] = None

# Properties to receive via API on creation
class CommentCreate(CommentBase):
    content: str
    task_id: int
    author_id: int # This will be set by the authenticated user, but schema expects it

# Properties to receive via API on update
class CommentUpdate(CommentBase):
    pass

# Properties shared by models stored in DB
class CommentInDBBase(CommentBase):
    id: int
    task_id: int
    author_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Additional properties to return via API
class Comment(CommentInDBBase):
    author: User
    task: TaskMinimal # Use minimal representation of task