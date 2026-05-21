from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.user import User # For comment author details

# Shared properties
class TaskCommentBase(BaseModel):
    comment_text: str = Field(..., min_length=1, max_length=1000)

# Properties to receive via API on creation
class TaskCommentCreate(TaskCommentBase):
    task_id: int

# Properties to receive via API on update
class TaskCommentUpdate(TaskCommentBase):
    pass

# Properties shared by models stored in DB
class TaskCommentInDBBase(TaskCommentBase):
    id: int
    task_id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True) # orm_mode = True for Pydantic v1

# Additional properties to return via API
class TaskComment(TaskCommentInDBBase):
    user: User # Include the full User object for the comment author

# Properties stored in DB but not returned by API
class TaskCommentInDB(TaskCommentInDBBase):
    pass