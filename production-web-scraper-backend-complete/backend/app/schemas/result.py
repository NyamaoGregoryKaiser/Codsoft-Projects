from datetime import datetime
from typing import Any, Dict

from pydantic import BaseModel

class ScrapedDataBase(BaseModel):
    job_id: int
    scraper_id: int
    data: Dict[str, Any] # Dynamic JSON content

class ScrapedDataCreate(ScrapedDataBase):
    pass

class ScrapedDataInDBBase(ScrapedDataBase):
    id: int
    scraped_at: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ScrapedData(ScrapedDataInDBBase):
    pass
```
---