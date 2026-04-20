from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

# Forward reference for Chart
class Chart(BaseModel):
    id: int
    title: str
    chart_type: str
    class Config:
        from_attributes = True

class DashboardBase(BaseModel):
    title: str
    description: Optional[str] = None

class DashboardCreate(DashboardBase):
    pass

class DashboardUpdate(DashboardBase):
    title: Optional[str] = None

class DashboardInDBBase(DashboardBase):
    id: int
    owner_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class Dashboard(DashboardInDBBase):
    # This will be populated when fetching a dashboard with its charts
    charts: List[Chart] = []