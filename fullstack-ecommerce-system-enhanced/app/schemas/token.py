```python
from pydantic import BaseModel, EmailStr
from typing import Optional

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[EmailStr] = None
    user_id: Optional[int] = None
    is_admin: bool = False

```