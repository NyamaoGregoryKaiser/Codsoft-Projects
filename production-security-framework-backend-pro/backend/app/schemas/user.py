```python
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field

# Base User Schema - common fields for all user representations
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    is_active: Optional[bool] = True
    role: str = "user" # Default role

# Schema for creating a user (input)
class UserCreate(UserBase):
    password: str = Field(..., min_length=8) # Password required on creation

# Schema for updating a user (input)
class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    password: Optional[str] = Field(None, min_length=8)
    is_active: Optional[bool] = None
    role: Optional[str] = None # Admin might update roles

# Schema for a user response (output) - omitting password hash
class User(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class ConfigDict:
        from_attributes = True

# Used for detailed user view including related items, possibly with pagination
class UserWithProjects(User):
    # This could be a list of Project schemas, but for brevity, we'll keep it simple
    # projects: List["Project"] = []
    pass

# For internal use (e.g., current user object in dependencies)
class CurrentUser(User):
    pass

# Update forward refs
# UserWithProjects.update_forward_refs() # No longer needed with Pydantic v2
```