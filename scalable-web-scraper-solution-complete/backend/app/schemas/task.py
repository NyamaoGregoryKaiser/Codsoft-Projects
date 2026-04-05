from pydantic import BaseModel, HttpUrl, Field
from datetime import datetime
from typing import Optional, List, Dict, Any
from app.models.task import TaskStatus

class ScrapingTaskBase(BaseModel):
    name: str = Field(..., min_length=3, max_length=100)
    target_url: HttpUrl
    css_selector: Optional[str] = None # Can be a single selector or comma-separated
    frequency_seconds: int = Field(3600, ge=60, description="Minimum 60 seconds (1 minute)")
    is_active: bool = True

class ScrapingTaskCreate(ScrapingTaskBase):
    pass

class ScrapingTaskUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=3, max_length=100)
    target_url: Optional[HttpUrl] = None
    css_selector: Optional[str] = None
    frequency_seconds: Optional[int] = Field(None, ge=60, description="Minimum 60 seconds (1 minute)")
    is_active: Optional[bool] = None
    status: Optional[TaskStatus] = None # For admin to update status manually

class ScrapingTask(ScrapingTaskBase):
    id: int
    owner_id: int
    status: TaskStatus
    last_run_at: Optional[datetime] = None
    next_run_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ScrapingTaskWithResults(ScrapingTask):
    results: List['ScrapingResult'] = []
```