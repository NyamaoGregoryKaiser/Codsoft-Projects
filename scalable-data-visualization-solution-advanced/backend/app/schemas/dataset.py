```python
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid

from pydantic import BaseModel, Field

class DatasetBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    data_source_id: int
    query: Optional[str] = Field(None, description="SQL query, API endpoint path, or file path within data source config.")
    filters: Optional[List[Dict[str, Any]]] = Field([], description="List of filter conditions, e.g., [{'field': 'col', 'operator': '=', 'value': 'val'}]")
    processing_config: Optional[Dict[str, Any]] = Field({}, description="Configuration for data processing like aggregations, column renaming.")

class DatasetCreate(DatasetBase):
    pass

class DatasetUpdate(DatasetBase):
    name: Optional[str] = None
    description: Optional[str] = None
    data_source_id: Optional[int] = None
    query: Optional[str] = None
    filters: Optional[List[Dict[str, Any]]] = None
    processing_config: Optional[Dict[str, Any]] = None

class DatasetInDBBase(DatasetBase):
    id: int
    uuid: uuid.UUID
    owner_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class Dataset(DatasetInDBBase):
    pass

class DatasetInDB(DatasetInDBBase):
    pass
```