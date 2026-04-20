from pydantic import BaseModel
from datetime import datetime
from typing import Dict, Any, Optional

class DatasetBase(BaseModel):
    name: str
    description: Optional[str] = None
    source_type: str
    source_config: Dict[str, Any] # Flexible JSON field

class DatasetCreate(DatasetBase):
    pass

class DatasetUpdate(DatasetBase):
    name: Optional[str] = None
    source_type: Optional[str] = None
    source_config: Optional[Dict[str, Any]] = None

class DatasetInDBBase(DatasetBase):
    id: int
    owner_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class Dataset(DatasetInDBBase):
    pass