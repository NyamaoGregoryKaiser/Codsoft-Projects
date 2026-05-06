```python
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from backend.schemas.common import DateTimeBase

class UserAgentBase(BaseModel):
    agent_string: str = Field(..., min_length=10)
    enabled: bool = True

class UserAgentCreate(UserAgentBase):
    pass

class UserAgentUpdate(UserAgentBase):
    agent_string: Optional[str] = None
    enabled: Optional[bool] = None

class UserAgentInDB(UserAgentBase, DateTimeBase):
    id: int
    last_used: datetime

    class Config:
        from_attributes = True
```