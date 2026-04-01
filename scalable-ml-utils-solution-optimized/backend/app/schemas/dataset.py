```python
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime

# Shared properties
class DatasetBase(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    column_info: Optional[Dict[str, Any]] = None
    row_count: Optional[int] = None

# Properties to receive via API on creation
class DatasetCreate(DatasetBase):
    name: str
    description: Optional[str] = None
    # file_path and owner_id are set internally by service/crud layer

# Properties to receive via API on update
class DatasetUpdate(DatasetBase):
    pass

# Properties to return via API
class Dataset(DatasetBase):
    id: int
    file_path: str # Always present after creation
    owner_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Schema for selecting columns for training
class DatasetColumnSelection(BaseModel):
    feature_columns: List[str]
    target_column: str
```