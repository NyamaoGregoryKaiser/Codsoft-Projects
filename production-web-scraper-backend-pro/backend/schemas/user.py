```python
from pydantic import BaseModel, EmailStr
from typing import Optional
from backend.schemas.common import DateTimeBase

class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    is_active: Optional[bool] = True
    is_admin: Optional[bool] = False

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class UserUpdate(UserBase):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None
    is_admin: Optional[bool] = None

class UserInDB(UserBase, DateTimeBase):
    id: int

    class Config:
        from_attributes = True # for SQLAlchemy integration
```