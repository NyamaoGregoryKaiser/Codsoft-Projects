from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, Field

from app.models.task import TaskStatus, TaskPriority
# Forward declaration for Comment and User to avoid circular imports
class CommentInTask(BaseModel):
    id: int
    content: str
    author_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class UserInTask(BaseModel):
    id: int
    email: str

    class Config:
        from_attributes = True

class TaskBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=2000)
    status: TaskStatus = TaskStatus.todo
    priority: TaskPriority = TaskPriority.medium
    assigned_to_id: Optional[int] = None

class TaskCreate(TaskBase):
    project_id: int

class TaskUpdate(TaskBase):
    title: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=2000)
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    assigned_to_id: Optional[int] = None

class TaskInDBBase(TaskBase):
    id: int
    project_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class Task(TaskInDBBase):
    # Public facing task schema
    pass

class TaskDetail(TaskInDBBase):
    # For detailed view, include assigned_to user and comments
    assigned_to: Optional[UserInTask] = None
    comments: List[CommentInTask] = []

    class Config:
        from_attributes = True

# Update forward references
CommentInTask.model_rebuild()
UserInTask.model_rebuild()

```