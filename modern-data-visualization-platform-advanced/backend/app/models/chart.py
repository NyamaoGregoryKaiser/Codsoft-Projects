```python
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import ForeignKey, String, Text, JSON, Enum
from enum import Enum as PyEnum
from typing import List, Dict, Any

from app.db.base import Base

class ChartType(str, PyEnum):
    BAR = "bar"
    LINE = "line"
    PIE = "pie"
    SCATTER = "scatter"
    AREA = "area"
    TABLE = "table"
    # Add more chart types as supported by your frontend visualization library (e.g., ECharts)

class Chart(Base):
    """
    Represents a single data visualization chart.
    """
    __tablename__ = "charts"

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    chart_type: Mapped[ChartType] = mapped_column(Enum(ChartType, name="chart_type_enum"), nullable=False)
    query: Mapped[str] = mapped_column(Text, nullable=False) # SQL query or API endpoint config
    query_params: Mapped[Dict[str, Any] | None] = mapped_column(JSON, nullable=True) # Parameters for the query
    visualization_options: Mapped[Dict[str, Any] | None] = mapped_column(JSON, nullable=True) # ECharts options, Plotly layout, etc.
    data_source_id: Mapped[int] = mapped_column(ForeignKey("data_sources.id"), nullable=False)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)

    # Relationships
    owner: Mapped["User"] = relationship("User", back_populates="charts")
    data_source: Mapped["DataSource"] = relationship("DataSource", back_populates="charts")
    dashboards: Mapped[List["Dashboard"]] = relationship(
        "Dashboard",
        secondary="dashboard_charts",
        back_populates="charts"
    )

    def __repr__(self):
        return f"<Chart(id={self.id}, title='{self.title}', type='{self.chart_type}', data_source_id={self.data_source_id})>"
```