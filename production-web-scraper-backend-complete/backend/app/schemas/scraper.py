from datetime import datetime
from typing import Any, Dict, List

from pydantic import BaseModel, HttpUrl, Field

class ScraperBase(BaseModel):
    name: str = Field(..., min_length=3, max_length=100)
    description: str | None = Field(None, max_length=500)
    target_url: HttpUrl
    parse_rules: Dict[str, Any] = Field(..., description="JSON object defining parsing rules (e.g., CSS selectors, XPath)")

class ScraperCreate(ScraperBase):
    pass

class ScraperUpdate(BaseModel):
    name: str | None = Field(None, min_length=3, max_length=100)
    description: str | None = Field(None, max_length=500)
    target_url: HttpUrl | None = None
    parse_rules: Dict[str, Any] | None = None

class ScraperInDBBase(ScraperBase):
    id: int
    owner_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True # Changed from orm_mode = True for Pydantic v2

class Scraper(ScraperInDBBase):
    pass

class ScraperWithJobs(ScraperInDBBase):
    # This would include a list of jobs if we wanted to embed them
    # from app.schemas.job import Job
    # jobs: List[Job] = []
    pass

```
---