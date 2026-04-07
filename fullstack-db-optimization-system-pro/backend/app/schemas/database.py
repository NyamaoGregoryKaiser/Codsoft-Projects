from typing import Optional
from pydantic import BaseModel, Field, IPvAnyAddress
from datetime import datetime
from app.db.models import DatabaseType

class DatabaseBase(BaseModel):
    name: str = Field(min_length=3, max_length=50)
    db_type: DatabaseType = DatabaseType.POSTGRESQL
    host: str # IPvAnyAddress for strict validation
    port: int = Field(..., gt=0, lt=65536)
    db_name: str = Field(min_length=1, max_length=50)
    username: str = Field(min_length=1, max_length=50)
    password: str = Field(min_length=1) # In production, this would be more complex/secure
    description: Optional[str] = Field(None, max_length=1000)

class DatabaseCreate(DatabaseBase):
    owner_id: int # Should be set by current user, not provided by client directly for security

class DatabaseUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=3, max_length=50)
    db_type: Optional[DatabaseType] = None
    host: Optional[str] = None
    port: Optional[int] = Field(None, gt=0, lt=65536)
    db_name: Optional[str] = Field(None, min_length=1, max_length=50)
    username: Optional[str] = Field(None, min_length=1, max_length=50)
    password: Optional[str] = Field(None, min_length=1)
    description: Optional[str] = Field(None, max_length=1000)

class DatabaseInDBBase(DatabaseBase):
    id: int
    owner_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class Database(DatabaseInDBBase):
    pass