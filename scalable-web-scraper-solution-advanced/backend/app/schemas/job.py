from datetime import datetime
from typing import Optional

from pydantic import BaseModel

class ScrapingJobBase(BaseModel):
    scraper_id: int

class ScrapingJobCreate(ScrapingJobBase):
    pass

class ScrapingJobUpdate(BaseModel):
    status: Optional[str] = None
    result_count: Optional[int] = None
    error_message: Optional[str] = None

class ScrapingJobInDBBase(ScrapingJobBase):
    id: int
    owner_id: int
    status: str = "pending"
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    result_count: int = 0
    error_message: Optional[str] = None

    class Config:
        from_attributes = True

class ScrapingJob(ScrapingJobInDBBase):
    pass