```python
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

# Base Task Schema
class TaskBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=100)
    description: Optional[str] = Field(None, max_length=1000)
    status: str = Field("pending", pattern="^(pending|in-progress|completed)$") # Enforce specific statuses

# Schema for creating a task (input)
class TaskCreate(TaskBase):
    project_id: int
    assigned_to_id: Optional[int] = None

# Schema for updating a task (input)
class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=100)
    description: Optional[str] = Field(None, max_length=1000)
    status: Optional[str] = Field(None, pattern="^(pending|in-progress|completed)$")
    assigned_to_id: Optional[int] = None

# Schema for a task response (output)
class Task(TaskBase):
    id: int
    project_id: int
    assigned_to_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class ConfigDict:
        from_attributes = True
```