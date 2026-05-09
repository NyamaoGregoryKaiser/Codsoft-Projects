from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field

# Base Role Schema
class RoleBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    description: Optional[str] = Field(None, max_length=255)

# Role Creation Schema
class RoleCreate(RoleBase):
    pass

# Role Read Schema
class RoleRead(RoleBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Base User Schema
class UserBase(BaseModel):
    email: EmailStr = Field(..., example="user@example.com")
    full_name: Optional[str] = Field(None, max_length=100, example="John Doe")

# User Creation Schema (for registration)
class UserCreate(UserBase):
    password: str = Field(..., min_length=8, example="StrongPassword123")

# User Update Schema
class UserUpdate(UserBase):
    full_name: Optional[str] = Field(None, max_length=100, example="Jane Doe")
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None

# User Read Schema (full details, for admin or self-profile)
class UserRead(UserBase):
    id: int
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: datetime
    roles: List[RoleRead] = []

    class Config:
        from_attributes = True

# User Read Public Schema (less sensitive details)
class UserReadPublic(UserBase):
    id: int
    is_verified: bool
    roles: List[RoleRead] = []

    class Config:
        from_attributes = True

# Schema for assigning roles to a user
class UserRoleAssignment(BaseModel):
    role_ids: List[int] = Field(..., min_items=1, example=[1, 2])

# Schema for Login request
class UserLogin(BaseModel):
    email: EmailStr = Field(..., example="user@example.com")
    password: str = Field(..., example="StrongPassword123")

# Schema for successful login response
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    refresh_token: str
    user: UserReadPublic

# Schema for token refresh request
class TokenRefresh(BaseModel):
    refresh_token: str

# Schema for password change (authenticated user)
class UserPasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)

# Schema for password forgot request
class ForgotPasswordRequest(BaseModel):
    email: EmailStr

# Schema for password reset request (with token)
class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)

# Schema for email verification request
class VerifyEmailRequest(BaseModel):
    token: str

# General message response schema
class Message(BaseModel):
    message: str
```