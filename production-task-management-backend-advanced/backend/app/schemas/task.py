from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.db.models import TaskStatus, TaskPriority
from app.schemas.user import User
from app.schemas.project import ProjectMinimal # Use minimal to avoid deep nesting

# Shared properties
class TaskBase(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = TaskStatus.OPEN
    priority: Optional[TaskPriority] = TaskPriority.MEDIUM
    due_date: Optional[datetime] = None
    assignee_id: Optional[int] = None

# Properties to receive via API on creation
class TaskCreate(TaskBase):
    title: str
    project_id: int
    creator_id: int # This will be set by the authenticated user, but schema expects it

# Properties to receive via API on update
class TaskUpdate(TaskBase):
    pass

# Properties shared by models stored in DB
class TaskInDBBase(TaskBase):
    id: int
    project_id: int
    creator_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Additional properties to return via API
class Task(TaskInDBBase):
    assignee: Optional[User] = None
    creator: User
    project: ProjectMinimal # Use minimal representation of project

# Optional: To be used in Comment schema for nested task details
class TaskMinimal(TaskInDBBase):
    title: str
    status: TaskStatus