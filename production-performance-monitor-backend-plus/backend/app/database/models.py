from datetime import datetime
import enum
from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    ForeignKey,
    Float,
    Text,
    Enum,
    UniqueConstraint,
    Index
)
from sqlalchemy.orm import relationship

from app.database.base import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    applications = relationship("Application", back_populates="owner")

    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}')>"


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    api_key = Column(String, unique=True, index=True, nullable=False) # Used for external app data submission
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner = relationship("User", back_populates="applications")
    metrics = relationship("Metric", back_populates="application", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Application(id={self.id}, name='{self.name}')>"


class MetricType(str, enum.Enum):
    """Enum for different types of metrics."""
    GAUGE = "gauge"       # A single numerical value that can go up or down.
    COUNTER = "counter"   # A cumulative metric that only ever goes up.
    HISTOGRAM = "histogram" # Samples observations (e.g., request durations) and counts them in configurable buckets.
    SUMMARY = "summary"   # Similar to a histogram, but stores quantiles (e.g., p50, p90, p99).


class Metric(Base):
    __tablename__ = "metrics"

    id = Column(Integer, primary_key=True, index=True)
    app_id = Column(Integer, ForeignKey("applications.id"), nullable=False)
    name = Column(String, nullable=False) # e.g., 'cpu_usage', 'request_latency', 'error_rate'
    unit = Column(String, nullable=True)  # e.g., '%', 'ms', 'count'
    metric_type = Column(Enum(MetricType), default=MetricType.GAUGE, nullable=False)
    threshold_warning = Column(Float, nullable=True)
    threshold_critical = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    application = relationship("Application", back_populates="metrics")
    data_points = relationship("MetricData", back_populates="metric", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint("app_id", "name", name="uq_app_id_name"), # Metric names must be unique per application
        Index("idx_metric_app_id_name", "app_id", "name")
    )

    def __repr__(self):
        return f"<Metric(id={self.id}, name='{self.name}', app_id={self.app_id})>"


class MetricData(Base):
    __tablename__ = "metric_data"

    id = Column(Integer, primary_key=True, index=True)
    metric_id = Column(Integer, ForeignKey("metrics.id"), nullable=False)
    value = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True) # Indexed for time-series queries

    metric = relationship("Metric", back_populates="data_points")

    __table_args__ = (
        Index("idx_metric_data_metric_id_timestamp", "metric_id", "timestamp"),
        # Potentially add partitioning for large tables in a real production setup
    )

    def __repr__(self):
        return f"<MetricData(id={self.id}, metric_id={self.metric_id}, value={self.value}, timestamp={self.timestamp})>"