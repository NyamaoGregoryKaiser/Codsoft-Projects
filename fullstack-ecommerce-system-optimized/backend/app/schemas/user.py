```python
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None


class UserCreate(UserBase):
    password: str # Password required for creation
    is_superuser: bool = False # Default to False, can be set by admin later


class UserUpdate(UserBase):
    password: Optional[str] = None
    full_name: Optional[str] = None
    is_active: Optional[bool] = None
    is_superuser: Optional[bool] = None


class UserPublic(UserBase):
    id: int
    is_active: bool
    is_superuser: bool
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True # Allow Pydantic to read ORM attributes
    }

```