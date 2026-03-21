```python
from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field

class DatasetBase(BaseModel):
    name: str
    file_path: Optional[str] = None # Path on server
    file_size_bytes: Optional[int] = None
    row_count: Optional[int] = None
    column_count: Optional[int] = None
    description: Optional[str] = None
    is_preprocessed: bool = False
    original_dataset_id: Optional[int] = None

class DatasetCreate(BaseModel):
    name: str
    description: Optional[str] = None

class DatasetUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class DatasetInDBBase(DatasetBase):
    id: Optional[int] = None
    owner_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class Dataset(DatasetInDBBase):
    pass

class DatasetColumn(BaseModel):
    name: str
    dtype: str
    unique_values: int
    missing_values: int
    mean: Optional[float] = None
    median: Optional[float] = None
    std: Optional[float] = None
    min: Optional[Any] = None
    max: Optional[Any] = None
    value_counts: Optional[Dict[str, int]] = None

class DatasetStats(BaseModel):
    columns: List[DatasetColumn]
    numerical_summary: Optional[Dict[str, Any]] = None # Pandas describe() output
    categorical_summary: Optional[Dict[str, Any]] = None
    head: Optional[List[Dict[str, Any]]] = None
    tail: Optional[List[Dict[str, Any]]] = None
```