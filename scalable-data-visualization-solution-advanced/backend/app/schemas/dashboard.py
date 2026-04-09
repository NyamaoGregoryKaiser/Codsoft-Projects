```python
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid

from pydantic import BaseModel, Field

class DashboardItemConfig(BaseModel):
    visualization_id: int
    x: int
    y: int
    w: int
    h: int
    meta_config: Optional[Dict[str, Any]] = Field({}, description="Additional configuration for the dashboard item (e.g., title overrides).")

class DashboardBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    layout: Optional[List[Dict[str, Any]]] = Field([], description="Grid layout configuration for dashboard items (e.g., react-grid-layout format).")

class DashboardCreate(DashboardBase):
    items: Optional[List[DashboardItemConfig]] = []

class DashboardUpdate(DashboardBase):
    name: Optional[str] = None
    description: Optional[str] = None
    layout: Optional[List[Dict[str, Any]]] = None
    items: Optional[List[DashboardItemConfig]] = None # For updating items, replace existing ones

class DashboardInDBBase(DashboardBase):
    id: int
    uuid: uuid.UUID
    owner_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class Dashboard(DashboardInDBBase):
    items: List[DashboardItemConfig] = [] # Nested items for read operations

class DashboardInDB(DashboardInDBBase):
    pass
```