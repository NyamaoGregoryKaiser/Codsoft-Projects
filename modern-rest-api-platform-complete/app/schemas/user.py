from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=64)

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(None, min_length=8, max_length=64)
    is_active: Optional[bool] = None
    is_admin: Optional[bool] = None

class UserInDBBase(UserBase):
    id: int
    is_active: bool
    is_admin: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True # Allows SQLAlchemy models to be converted to Pydantic

class User(UserInDBBase):
    pass # This is the public facing user schema

class UserAdmin(UserInDBBase):
    # This schema might include sensitive fields only visible to admins
    pass

```