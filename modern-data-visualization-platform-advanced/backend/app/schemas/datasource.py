```python
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from app.models.datasource import DataSourceType

class DataSourceBase(BaseModel):
    name: str = Field(min_length=3, max_length=255)
    type: DataSourceType
    description: Optional[str] = None
    connection_string: Optional[str] = None
    config: Optional[Dict[str, Any]] = None # Generic JSON field for additional config

class DataSourceCreate(DataSourceBase):
    pass

class DataSourceUpdate(DataSourceBase):
    name: Optional[str] = Field(None, min_length=3, max_length=255)
    type: Optional[DataSourceType] = None

class DataSourceInDBBase(DataSourceBase):
    id: int
    owner_id: int
    class ConfigDict:
        from_attributes = True

class DataSource(DataSourceInDBBase):
    pass
```