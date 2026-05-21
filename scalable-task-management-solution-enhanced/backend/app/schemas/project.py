from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime

from app.schemas.user import User # Import the User schema

# Shared properties
class ProjectBase(BaseModel):
    name: str = Field(..., min_length=3, max_length=100)
    description: Optional[str] = Field(None, max_length=1000)

# Properties to receive via API on creation
class ProjectCreate(ProjectBase):
    pass

# Properties to receive via API on update
class ProjectUpdate(ProjectBase):
    pass

# Properties shared by models stored in DB
class ProjectInDBBase(ProjectBase):
    id: int
    owner_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True) # orm_mode = True for Pydantic v1

# Additional properties to return via API
class Project(ProjectInDBBase):
    owner: User # Include the full User object for the owner
    tasks_count: Optional[int] = None # For aggregation, if needed

# Properties stored in DB but not returned by API
class ProjectInDB(ProjectInDBBase):
    pass