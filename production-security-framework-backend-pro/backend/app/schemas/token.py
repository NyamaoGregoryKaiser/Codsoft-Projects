```python
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    refresh_token: Optional[str] = None

class TokenPayload(BaseModel):
    user_id: Optional[int] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    exp: Optional[datetime] = None
    sub: Optional[str] = None # 'access' or 'refresh'

class TokenData(BaseModel):
    """Schema for data extracted from JWT payload."""
    user_id: int
    email: EmailStr
    role: str
    exp: datetime
    sub: str # Type of token: 'access' or 'refresh'
```