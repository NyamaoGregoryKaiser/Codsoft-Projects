```python
from pydantic import BaseModel, Field, IPvAnyAddress
from typing import Optional
from datetime import datetime
from backend.schemas.common import DateTimeBase

class ProxyBase(BaseModel):
    address: IPvAnyAddress
    port: int = Field(..., ge=1, le=65535)
    username: Optional[str] = None
    password: Optional[str] = None
    enabled: bool = True

class ProxyCreate(ProxyBase):
    pass

class ProxyUpdate(ProxyBase):
    address: Optional[IPvAnyAddress] = None
    port: Optional[int] = None
    username: Optional[str] = None
    password: Optional[str] = None
    enabled: Optional[bool] = None

class ProxyInDB(ProxyBase, DateTimeBase):
    id: int
    last_used: datetime
    failed_attempts: int

    class Config:
        from_attributes = True
```