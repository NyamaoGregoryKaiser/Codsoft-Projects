from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, Field

# Forward declaration for Task to avoid circular imports
class TaskInProject(BaseModel):
    id: int
    title: str
    status: str
    priority: str
    assigned_to_id: Optional[int] = None

    class Config:
        from_attributes = True


class ProjectBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=1000)

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(ProjectBase):
    title: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=1000)

class ProjectInDBBase(ProjectBase):
    id: int
    owner_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class Project(ProjectInDBBase):
    # Public facing project schema
    # owner: User # This would require importing User schema, creating a potential circular import if User also references Project
    pass

class ProjectDetail(ProjectInDBBase):
    # For detailed view, include related tasks
    tasks: List[TaskInProject] = [] # Use the forward-declared Task schema

    class Config:
        from_attributes = True

# Update forward reference for TaskInProject
TaskInProject.model_rebuild()
```