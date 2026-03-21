from typing import Optional
from pydantic import EmailStr, Field

from app.schemas.base import BaseSchema


class UserBase(BaseSchema):
    email: EmailStr
    is_active: bool = True
    is_admin: bool = False

    class Config:
        from_attributes = True


class UserCreate(UserBase):
    password: str = Field(..., min_length=8)
    is_active: bool = True # Allow setting on creation
    is_admin: bool = False # Prevent setting on creation via API for security


class UserRegister(UserCreate):
    # This is specifically for public registration endpoint,
    # where users cannot set is_admin or is_active initially.
    is_active: bool = True
    is_admin: bool = False


class UserUpdate(UserBase):
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(None, min_length=8)
    is_active: Optional[bool] = None
    is_admin: Optional[bool] = None # Admin can set admin status


class UserInDB(UserBase):
    hashed_password: str