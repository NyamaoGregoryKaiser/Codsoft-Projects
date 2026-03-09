from datetime import datetime
from typing import List

from pydantic import BaseModel

class JobBase(BaseModel):
    scraper_id: int

class JobCreate(JobBase):
    pass

class JobUpdate(BaseModel):
    status: str | None = None
    log_output: str | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None

class JobInDBBase(JobBase):
    id: int
    owner_id: int
    status: str
    started_at: datetime | None = None
    completed_at: datetime | None = None
    log_output: str | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class Job(JobInDBBase):
    pass
```
---