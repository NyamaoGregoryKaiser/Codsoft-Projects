from pydantic import BaseModel, Field
from datetime import datetime
from typing import Dict, Any, Optional

class ScrapingResultBase(BaseModel):
    task_id: int
    data: Dict[str, Any]
    status_code: Optional[int] = None
    error_message: Optional[str] = None

class ScrapingResultCreate(ScrapingResultBase):
    pass

class ScrapingResult(ScrapingResultBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Add forward reference for recursive types if needed, or import at the end
from app.schemas.task import ScrapingTaskWithResults
ScrapingTaskWithResults.model_rebuild() # Rebuild the model after all deps are defined
```