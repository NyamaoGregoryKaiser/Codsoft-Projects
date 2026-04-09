```python
from typing import Optional, Dict, Any
from datetime import datetime
import uuid

from pydantic import BaseModel, Field

class ChartType(str, Enum):
    BAR_CHART = "BarChart"
    LINE_CHART = "LineChart"
    PIE_CHART = "PieChart"
    AREA_CHART = "AreaChart"
    SCATTER_CHART = "ScatterChart"

class VisualizationBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    dataset_id: int
    chart_type: ChartType
    chart_config: Dict[str, Any] = Field(..., description="Configuration specific to the chart type, e.g., axes, labels, colors.")

class VisualizationCreate(VisualizationBase):
    pass

class VisualizationUpdate(VisualizationBase):
    name: Optional[str] = None
    description: Optional[str] = None
    dataset_id: Optional[int] = None
    chart_type: Optional[ChartType] = None
    chart_config: Optional[Dict[str, Any]] = None

class VisualizationInDBBase(VisualizationBase):
    id: int
    uuid: uuid.UUID
    owner_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class Visualization(VisualizationInDBBase):
    pass

class VisualizationInDB(VisualizationInDBBase):
    pass
```