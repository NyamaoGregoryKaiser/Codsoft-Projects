```python
from typing import Optional
from pydantic import BaseModel, EmailStr, Field

# Base Pydantic models for User
class UserBase(BaseModel):
    email: EmailStr = Field(..., example="john.doe@example.com")
    full_name: Optional[str] = Field(None, example="John Doe")

class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=128, example="StrongPassword123!")
    role: str = Field("user", example="user", description="User role: 'user' or 'admin'")
    is_active: bool = Field(True, example=True)

class UserUpdate(UserBase):
    full_name: Optional[str] = Field(None, example="John A. Doe")
    password: Optional[str] = Field(None, min_length=8, max_length=128, example="NewStrongPass123")
    is_active: Optional[bool] = Field(None, example=False)
    role: Optional[str] = Field(None, example="admin")

class UserInDB(UserBase):
    id: int
    is_active: bool
    role: str
    created_at: Optional[str] = None # Datetime converted to string for Pydantic
    updated_at: Optional[str] = None

    class Config:
        orm_mode = True # Enable ORM mode for Pydantic
```