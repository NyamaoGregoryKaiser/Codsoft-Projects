from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

from app.models.task import TaskStatus, TaskPriority
from app.schemas.user import User # For assignee and creator details

# Shared properties
class TaskBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    status: Optional[TaskStatus] = TaskStatus.TODO
    priority: Optional[TaskPriority] = TaskPriority.MEDIUM
    due_date: Optional[datetime] = None

# Properties to receive via API on creation
class TaskCreate(TaskBase):
    project_id: int
    assignee_id: Optional[int] = None

# Properties to receive via API on update
class TaskUpdate(TaskBase):
    project_id: Optional[int] = None
    assignee_id: Optional[int] = None
    creator_id: Optional[int] = None # Should not be updated via API directly

# Properties shared by models stored in DB
class TaskInDBBase(TaskBase):
    id: int
    project_id: int
    creator_id: int
    created_at: datetime
    updated_at: datetime
    assignee_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True) # orm_mode = True for Pydantic v1

# Additional properties to return via API
class Task(TaskInDBBase):
    project_name: Optional[str] = None # For easier display
    creator: Optional[User] = None
    assignee: Optional[User] = None

# Properties stored in DB but not returned by API
class TaskInDB(TaskInDBBase):
    pass