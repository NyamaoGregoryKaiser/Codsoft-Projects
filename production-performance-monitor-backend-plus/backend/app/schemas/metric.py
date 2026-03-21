from typing import Optional
from pydantic import Field, BeforeValidator
from typing_extensions import Annotated

from app.schemas.base import BaseSchema
from app.database.models import MetricType


class MetricBase(BaseSchema):
    app_id: int
    name: str = Field(..., min_length=3, max_length=100)
    unit: Optional[str] = Field(None, max_length=20)
    metric_type: MetricType = MetricType.GAUGE
    threshold_warning: Optional[float] = Field(None, ge=0)
    threshold_critical: Optional[float] = Field(None, ge=0)

    class Config:
        from_attributes = True
        use_enum_values = True # Ensure enum values are used in JSON


class MetricCreate(MetricBase):
    app_id: Optional[int] = None # Will be set by path parameter


class MetricUpdate(MetricBase):
    app_id: Optional[int] = None
    name: Optional[str] = Field(None, min_length=3, max_length=100)
    unit: Optional[str] = Field(None, max_length=20)
    metric_type: Optional[MetricType] = None
    threshold_warning: Optional[float] = Field(None, ge=0)
    threshold_critical: Optional[float] = Field(None, ge=0)


class MetricResponse(MetricBase):
    pass