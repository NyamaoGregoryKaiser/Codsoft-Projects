```python
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


# Base user schema
class UserBase(BaseModel):
    """
    Base Pydantic schema for user properties common to creation and reading.
    """
    username: str = Field(..., min_length=3, max_length=50, description="Unique username")
    email: EmailStr = Field(..., description="Unique email address")


# User creation schema
class UserCreate(UserBase):
    """
    Pydantic schema for creating a new user. Includes password.
    """
    password: str = Field(..., min_length=8, description="User password")


# User update schema
class UserUpdate(BaseModel):
    """
    Pydantic schema for updating an existing user's properties.
    All fields are optional, allowing partial updates.
    """
    username: Optional[str] = Field(None, min_length=3, max_length=50, description="New username")
    email: Optional[EmailStr] = Field(None, description="New email address")
    password: Optional[str] = Field(None, min_length=8, description="New password")
    is_active: Optional[bool] = None
    is_admin: Optional[bool] = None


# User response schema (read-only)
class UserInDBBase(UserBase):
    """
    Pydantic schema for user properties as stored in the database,
    excluding sensitive information like hashed password.
    """
    id: int = Field(..., description="Unique identifier for the user")
    is_active: bool = Field(True, description="Whether the user account is active")
    is_admin: bool = Field(False, description="Whether the user has administrative privileges")
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True  # Allows ORM models to be directly converted to Pydantic models


# Specific schemas for different response needs
class User(UserInDBBase):
    """
    Full Pydantic schema for a user, used for general API responses.
    """
    pass

class UserWithChats(UserInDBBase):
    """
    Pydantic schema for a user including their chat room memberships.
    (Placeholder, actual chat schemas would be imported and included)
    """
    # chat_memberships: List["ChatRoomSchema"] # Would require forward reference and actual chat schema
    pass

# Forward reference for circular dependencies, if User is part of ChatRoom schema
# User.model_rebuild()
```