```python
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field

# Base schema for User, includes common fields
class UserBase(BaseModel):
    email: EmailStr = Field(..., example="user@example.com")
    first_name: Optional[str] = Field(None, example="John")
    last_name: Optional[str] = Field(None, example="Doe")
    is_active: bool = Field(True, example=True)
    is_admin: bool = Field(False, example=False)

# Schema for creating a new user (password is required)
class UserCreate(UserBase):
    password: str = Field(..., min_length=8, example="StrongPassword123")

# Schema for updating an existing user (password is optional)
class UserUpdate(UserBase):
    email: Optional[EmailStr] = Field(None, example="new_email@example.com")
    password: Optional[str] = Field(None, min_length=8, example="NewStrongPassword456")
    is_active: Optional[bool] = Field(None, example=False)
    is_admin: Optional[bool] = Field(None, example=True) # Only admins can update this

# Schema for public representation of a user (hashed_password is excluded)
class UserPublic(UserBase):
    id: int = Field(..., example=1)
    created_at: datetime = Field(..., example=datetime.now())
    updated_at: datetime = Field(..., example=datetime.now())

    class Config:
        from_attributes = True # Alias for orm_mode=True in Pydantic v1.x

```