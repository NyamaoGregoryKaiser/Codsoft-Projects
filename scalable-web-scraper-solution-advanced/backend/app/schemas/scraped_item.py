from typing import Any, Dict, Optional

from pydantic import BaseModel, HttpUrl

class ScrapedItemBase(BaseModel):
    scraper_id: int
    data: Dict[str, Any]
    source_url: Optional[HttpUrl] = None

class ScrapedItemCreate(ScrapedItemBase):
    job_id: Optional[int] = None

class ScrapedItemInDBBase(ScrapedItemBase):
    id: int
    job_id: Optional[int] = None

    class Config:
        from_attributes = True

class ScrapedItem(ScrapedItemInDBBase):
    pass