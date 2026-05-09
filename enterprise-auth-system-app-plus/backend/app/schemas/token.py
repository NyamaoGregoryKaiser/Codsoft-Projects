```python
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: Optional[int] = None  # User ID
    exp: Optional[datetime] = None # Expiration timestamp
    is_refresh_token: bool = False # Differentiate access vs refresh tokens


class RefreshTokenInfo(BaseModel):
    id: int
    token: str
    user_id: int
    expires_at: datetime
    is_revoked: bool
    created_at: datetime

    class Config:
        from_attributes = True

```