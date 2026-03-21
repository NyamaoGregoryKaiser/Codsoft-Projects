```python
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import ForeignKey, String, Text, JSON
from enum import Enum

from app.db.base import Base
from typing import List, Dict, Any

class DataSourceType(str, Enum):
    POSTGRESQL = "PostgreSQL"
    MYSQL = "MySQL"
    SQLSERVER = "SQL Server"
    S3 = "S3"
    GOOGLE_SHEETS = "Google Sheets"
    API = "API"
    # Add more as needed

class DataSource(Base):
    """
    Represents a data source connection (e.g., PostgreSQL, S3, API).
    """
    __tablename__ = "data_sources"

    name: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    type: Mapped[DataSourceType] = mapped_column(String(50), nullable=False)
    connection_string: Mapped[str | None] = mapped_column(Text, nullable=True) # For traditional DBs
    config: Mapped[Dict[str, Any] | None] = mapped_column(JSON, nullable=True) # For dynamic configs (e.g., API headers, S3 buckets, Google Sheets credentials)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)

    # Relationships
    owner: Mapped["User"] = relationship("User", back_populates="datasources")
    charts: Mapped[List["Chart"]] = relationship("Chart", back_populates="data_source", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<DataSource(id={self.id}, name='{self.name}', type='{self.type}')>"
```