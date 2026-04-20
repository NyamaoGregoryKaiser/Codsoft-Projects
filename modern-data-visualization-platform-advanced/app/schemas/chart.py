from pydantic import BaseModel
from datetime import datetime
from typing import Dict, Any, Optional

class ChartBase(BaseModel):
    title: str
    description: Optional[str] = None
    chart_type: str # e.g., "bar", "line", "pie"
    config: Dict[str, Any] # Chart.js/Plotly.js specific configuration
    dataset_id: int
    dashboard_id: Optional[int] = None

class ChartCreate(ChartBase):
    pass

class ChartUpdate(ChartBase):
    title: Optional[str] = None
    chart_type: Optional[str] = None
    config: Optional[Dict[str, Any]] = None
    dataset_id: Optional[int] = None
    dashboard_id: Optional[int] = None

class ChartInDBBase(ChartBase):
    id: int
    owner_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class Chart(ChartInDBBase):
    pass