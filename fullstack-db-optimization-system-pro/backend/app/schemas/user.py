from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime

from app.db.models import UserRole

class UserBase(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: EmailStr
    full_name: Optional[str] = Field(None, max_length=255)
    is_active: bool = True
    is_admin: bool = False
    role: UserRole = UserRole.USER

class UserCreate(UserBase):
    password: str = Field(min_length=8)

class UserUpdate(UserBase):
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(None, min_length=8)
    is_active: Optional[bool] = None
    is_admin: Optional[bool] = None
    role: Optional[UserRole] = None

class UserInDBBase(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class User(UserInDBBase):
    pass

class UserWithPasswordHash(UserInDBBase):
    hashed_password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    username: Optional[str] = None