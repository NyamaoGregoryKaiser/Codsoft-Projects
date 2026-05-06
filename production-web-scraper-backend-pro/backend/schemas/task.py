```python
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List, Dict, Any
from backend.models.task import TaskStatus
from backend.schemas.common import DateTimeBase
from backend.schemas.scraper import ScraperConfigInDB

class ScrapingTaskBase(BaseModel):
    scraper_config_id: int
    status: TaskStatus = TaskStatus.PENDING
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    log: Optional[str] = None
    result_count: int = 0

class ScrapingTaskCreate(BaseModel):
    scraper_config_id: int

class ScrapingTaskInDB(ScrapingTaskBase, DateTimeBase):
    id: int
    owner_id: int
    # To include related data in response
    config: Optional[ScraperConfigInDB] = None
    owner_username: Optional[str] = None

    class Config:
        from_attributes = True

class ScrapingResultBase(BaseModel):
    scraping_task_id: int
    data: Dict[str, Any] # The scraped data

class ScrapingResultInDB(ScrapingResultBase, DateTimeBase):
    id: int

    class Config:
        from_attributes = True

class PaginatedScrapingResults(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[ScrapingResultInDB]
```