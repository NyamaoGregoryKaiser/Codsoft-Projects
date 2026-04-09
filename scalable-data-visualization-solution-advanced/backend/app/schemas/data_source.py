```python
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum
import uuid

from pydantic import BaseModel, Field, HttpUrl

class DataSourceType(str, Enum):
    DATABASE = "DATABASE"
    FILE_UPLOAD = "FILE_UPLOAD"
    API = "API"

class DBType(str, Enum):
    POSTGRES = "POSTGRES"
    MYSQL = "MYSQL"
    SQLSERVER = "SQLSERVER"
    ORACLE = "ORACLE"
    CSV = "CSV"
    EXCEL = "EXCEL"
    JSON = "JSON" # For API responses or JSON files

class DataSourceBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    type: DataSourceType
    db_type: Optional[DBType] = None
    connection_string: Optional[HttpUrl] = None # For database URLs, API base URLs
    config: Dict[str, Any] = Field({}, description="Additional configuration, e.g., API keys, file paths, headers.")

class DataSourceCreate(DataSourceBase):
    pass

class DataSourceUpdate(DataSourceBase):
    name: Optional[str] = None
    description: Optional[str] = None
    type: Optional[DataSourceType] = None
    db_type: Optional[DBType] = None
    connection_string: Optional[HttpUrl] = None
    config: Optional[Dict[str, Any]] = None

class DataSourceInDBBase(DataSourceBase):
    id: int
    uuid: uuid.UUID
    owner_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class DataSource(DataSourceInDBBase):
    pass

class DataSourceInDB(DataSourceInDBBase):
    pass
```