```python
import uuid
from datetime import datetime
from typing import Optional, List
import json

from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, JSON, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy_utils import URLType

from app.db.base import Base
from app.schemas.data_source import DataSourceType, DBType

# User Model
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    data_sources: List["DataSource"] = relationship("DataSource", back_populates="owner", cascade="all, delete-orphan")
    datasets: List["Dataset"] = relationship("Dataset", back_populates="owner", cascade="all, delete-orphan")
    visualizations: List["Visualization"] = relationship("Visualization", back_populates="owner", cascade="all, delete-orphan")
    dashboards: List["Dashboard"] = relationship("Dashboard", back_populates="owner", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User(email='{self.email}', id={self.id})>"

# Data Source Model
class DataSource(Base):
    __tablename__ = "data_sources"
    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(UUID(as_uuid=True), default=uuid.uuid4, unique=True, nullable=False, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(String, nullable=True)
    type = Column(Enum(DataSourceType), nullable=False) # e.g., DATABASE, FILE_UPLOAD, API
    db_type = Column(Enum(DBType), nullable=True) # e.g., POSTGRES, MYSQL, CSV (if type=DATABASE or FILE_UPLOAD)
    connection_string = Column(URLType, nullable=True) # e.g., postgresql://user:pass@host:port/db
    config = Column(JSON, nullable=True, default={}) # For additional configs like API keys, file paths, etc.
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner: User = relationship("User", back_populates="data_sources")
    datasets: List["Dataset"] = relationship("Dataset", back_populates="data_source", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<DataSource(name='{self.name}', type='{self.type.value}', owner_id={self.owner_id})>"

# Dataset Model
class Dataset(Base):
    __tablename__ = "datasets"
    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(UUID(as_uuid=True), default=uuid.uuid4, unique=True, nullable=False, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(String, nullable=True)
    data_source_id = Column(Integer, ForeignKey("data_sources.id"), nullable=False)
    query = Column(Text, nullable=True) # SQL query, API endpoint path, or file path within data source config
    filters = Column(JSON, nullable=True, default=[]) # e.g., [{"field": "column_name", "operator": "=", "value": "value"}]
    processing_config = Column(JSON, nullable=True, default={}) # e.g., aggregations, column renaming
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner: User = relationship("User", back_populates="datasets")
    data_source: DataSource = relationship("DataSource", back_populates="datasets")
    visualizations: List["Visualization"] = relationship("Visualization", back_populates="dataset", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Dataset(name='{self.name}', data_source_id={self.data_source_id}, owner_id={self.owner_id})>"

# Visualization Model
class Visualization(Base):
    __tablename__ = "visualizations"
    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(UUID(as_uuid=True), default=uuid.uuid4, unique=True, nullable=False, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(String, nullable=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id"), nullable=False)
    chart_type = Column(String, nullable=False) # e.g., "BarChart", "LineChart", "PieChart"
    chart_config = Column(JSON, nullable=False, default={}) # e.g., {"x_axis": "column_1", "y_axis": "column_2", "title": "My Chart"}
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner: User = relationship("User", back_populates="visualizations")
    dataset: Dataset = relationship("Dataset", back_populates="visualizations")
    dashboard_items: List["DashboardItem"] = relationship("DashboardItem", back_populates="visualization", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Visualization(name='{self.name}', chart_type='{self.chart_type}', dataset_id={self.dataset_id})>"

# Dashboard Model
class Dashboard(Base):
    __tablename__ = "dashboards"
    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(UUID(as_uuid=True), default=uuid.uuid4, unique=True, nullable=False, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(String, nullable=True)
    layout = Column(JSON, nullable=True, default=[]) # Stores grid layout configuration (e.g., react-grid-layout format)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner: User = relationship("User", back_populates="dashboards")
    items: List["DashboardItem"] = relationship("DashboardItem", back_populates="dashboard", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Dashboard(name='{self.name}', owner_id={self.owner_id})>"

# DashboardItem Model (to link visualizations to dashboards and store their position/size)
class DashboardItem(Base):
    __tablename__ = "dashboard_items"
    id = Column(Integer, primary_key=True, index=True)
    dashboard_id = Column(Integer, ForeignKey("dashboards.id"), nullable=False)
    visualization_id = Column(Integer, ForeignKey("visualizations.id"), nullable=False)
    x = Column(Integer, nullable=False)
    y = Column(Integer, nullable=False)
    w = Column(Integer, nullable=False) # width
    h = Column(Integer, nullable=False) # height
    meta_config = Column(JSON, nullable=True, default={}) # Additional config for the item

    dashboard: Dashboard = relationship("Dashboard", back_populates="items")
    visualization: Visualization = relationship("Visualization", back_populates="dashboard_items")

    def __repr__(self):
        return f"<DashboardItem(dashboard_id={self.dashboard_id}, viz_id={self.visualization_id})>"
```