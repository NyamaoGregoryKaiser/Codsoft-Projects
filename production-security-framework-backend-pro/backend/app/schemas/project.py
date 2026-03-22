```python
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

# Base Project Schema
class ProjectBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=100)
    description: Optional[str] = Field(None, max_length=1000)

# Schema for creating a project (input)
class ProjectCreate(ProjectBase):
    pass

# Schema for updating a project (input)
class ProjectUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=100)
    description: Optional[str] = Field(None, max_length=1000)

# Schema for a project response (output)
class Project(ProjectBase):
    id: int
    owner_id: int
    created_at: datetime
    updated_at: datetime

    class ConfigDict:
        from_attributes = True

# Used for detailed project view including tasks, potentially with pagination
class ProjectWithTasks(Project):
    # This would typically be a list of Task schemas
    # from .task import Task # Import here to avoid circular dependency
    # tasks: List[Task] = []
    pass
```