from typing import Optional
from pydantic import BaseModel, Field
from datetime import datetime

from app.db.models import TaskStatus

class TaskBase(BaseModel):
    title: str = Field(min_length=5, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    status: TaskStatus = TaskStatus.PENDING
    priority: str = "Medium" # e.g., High, Medium, Low
    due_date: Optional[datetime] = None
    completed_at: Optional[datetime] = None

class TaskCreate(TaskBase):
    database_id: int
    suggestion_id: Optional[int] = None
    assigned_to_id: Optional[int] = None # Will be current user if not specified

class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=5, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    status: Optional[TaskStatus] = None
    priority: Optional[str] = None
    due_date: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    assigned_to_id: Optional[int] = None

class TaskInDBBase(TaskBase):
    id: int
    database_id: int
    suggestion_id: Optional[int] = None
    assigned_to_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class Task(TaskInDBBase):
    pass