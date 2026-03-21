```python
from typing import Optional
from pydantic import BaseModel, EmailStr, Field

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    is_active: bool = True
    is_superuser: bool = False

class UserCreate(UserBase):
    password: str = Field(min_length=8)

class UserUpdate(UserBase):
    password: Optional[str] = Field(None, min_length=8)
    email: Optional[EmailStr] = None # Email can also be updated

class UserInDBBase(UserBase):
    id: int
    class ConfigDict:
        from_attributes = True # Pydantic v2: use from_attributes instead of orm_mode

class User(UserInDBBase):
    pass # This will be the actual response model
```