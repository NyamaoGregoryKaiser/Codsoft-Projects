from typing import Optional, List
from datetime import datetime, timezone

from pydantic import BaseModel, EmailStr, Field, ConfigDict


class UserBase(BaseModel):
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    is_active: Optional[bool] = True
    is_superuser: Optional[bool] = False
    is_verified: Optional[bool] = False


class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128) # Password is required on create


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    first_name: Optional[str] = None
    last_name: Optional[str] = None


class UserUpdate(UserBase):
    password: Optional[str] = Field(None, min_length=8, max_length=128) # Password is optional on update
    email: Optional[EmailStr] = None # Allow email update too


class UserInDBBase(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True) # Enables ORM mode


class User(UserInDBBase):
    # This is the Pydantic model for users returned by the API
    pass


# Properties for API responses, includes nested items
class UserWithItems(User):
    from app.schemas.item import Item # Deferred import to avoid circular dependency
    items: List[Item] = []


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    user_id: Optional[int] = None
    sub: Optional[str] = None # Token subject, e.g., "access", "refresh", "password_reset"
    exp: Optional[datetime] = None


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordReset(BaseModel):
    token: str
    new_password: str = Field(min_length=8, max_length=128)


class EmailVerificationRequest(BaseModel):
    token: str
```