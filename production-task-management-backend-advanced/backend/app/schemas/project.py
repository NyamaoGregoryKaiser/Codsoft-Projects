from typing import Optional
from pydantic import BaseModel
from app.schemas.user import User

# Shared properties
class ProjectBase(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None

# Properties to receive via API on creation
class ProjectCreate(ProjectBase):
    title: str

# Properties to receive via API on update
class ProjectUpdate(ProjectBase):
    pass

# Properties shared by models stored in DB
class ProjectInDBBase(ProjectBase):
    id: int
    owner_id: int

    class Config:
        from_attributes = True

# Additional properties to return via API
class Project(ProjectInDBBase):
    owner: User
    # tasks: List["Task"] # Avoid circular import, add in models if needed or separate endpoint
    pass

# Optional: To be used in Task schema for nested project details
class ProjectMinimal(ProjectInDBBase):
    title: str
    description: Optional[str] = None

# If you want to include tasks when retrieving a project:
# from typing import List
# from app.schemas.task import Task
# class ProjectWithTasks(ProjectInDBBase):
#    owner: User
#    tasks: List[Task]