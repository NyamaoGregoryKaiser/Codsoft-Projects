from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime

class MetricBase(BaseModel):
    timestamp: Optional[datetime] = None # Will default to now() if not provided
    cpu_usage_percent: float = Field(0.0, ge=0.0, le=100.0)
    memory_usage_percent: float = Field(0.0, ge=0.0, le=100.0)
    disk_io_ops_sec: float = Field(0.0, ge=0.0)
    active_connections: int = Field(0, ge=0)
    total_queries_sec: float = Field(0.0, ge=0.0)
    avg_query_latency_ms: float = Field(0.0, ge=0.0)
    slow_queries_json: Optional[Dict[str, Any]] = {}
    custom_metrics_json: Optional[Dict[str, Any]] = {}

class MetricCreate(MetricBase):
    database_id: int

class MetricUpdate(BaseModel):
    timestamp: Optional[datetime] = None
    cpu_usage_percent: Optional[float] = Field(None, ge=0.0, le=100.0)
    memory_usage_percent: Optional[float] = Field(None, ge=0.0, le=100.0)
    disk_io_ops_sec: Optional[float] = Field(None, ge=0.0)
    active_connections: Optional[int] = Field(None, ge=0)
    total_queries_sec: Optional[float] = Field(None, ge=0.0)
    avg_query_latency_ms: Optional[float] = Field(None, ge=0.0)
    slow_queries_json: Optional[Dict[str, Any]] = None
    custom_metrics_json: Optional[Dict[str, Any]] = None

class MetricInDBBase(MetricBase):
    id: int
    database_id: int
    timestamp: datetime

    class Config:
        from_attributes = True

class Metric(MetricInDBBase):
    pass