from datetime import datetime
from typing import List, Optional
from pydantic import Field

from app.schemas.base import BaseSchema


class MetricDataPointBase(BaseSchema):
    metric_id: int
    value: float = Field(..., description="The value of the metric at the given timestamp.")
    timestamp: datetime

    class Config:
        from_attributes = True


class MetricDataPointCreate(BaseModel): # Not inheriting from BaseSchema as it has no ID/timestamps on creation
    name: str = Field(..., description="Name of the metric (e.g., 'cpu_usage').")
    value: float = Field(..., description="The value of the metric.")
    timestamp: Optional[datetime] = Field(None, description="Timestamp of the data point. Defaults to now if not provided.")


class MetricDataBatchCreate(BaseModel):
    # This schema is used when an external application sends data.
    # It requires the API key for authentication, and a list of data points.
    api_key: str = Field(..., description="API key of the monitored application.")
    data_points: List[MetricDataPointCreate] = Field(..., min_length=1)


class MetricDataPointResponse(MetricDataPointBase):
    # Optional: can include metric name or application name for richer response
    pass


class MetricDataAggregation(BaseModel):
    timestamp: datetime
    average: Optional[float] = None
    min: Optional[float] = None
    max: Optional[float] = None
    count: Optional[int] = None
    sum: Optional[float] = None
    # Add percentiles if needed for histogram/summary types