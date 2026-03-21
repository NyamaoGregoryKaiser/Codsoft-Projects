```python
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import ForeignKey, String, Text, Boolean, JSON

from app.db.base import Base
from typing import List, Dict, Any

class Dashboard(Base):
    """
    Represents a collection of charts arranged in a layout.
    """
    __tablename__ = "dashboards"

    title: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    layout_config: Mapped[Dict[str, Any] | None] = mapped_column(JSON, nullable=True) # Stores grid layout, chart positions/sizes
    is_public: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)

    # Relationships
    owner: Mapped["User"] = relationship("User", back_populates="dashboards")
    charts: Mapped[List["Chart"]] = relationship(
        "Chart",
        secondary="dashboard_charts", # This will be the association table
        back_populates="dashboards"
    )

    def __repr__(self):
        return f"<Dashboard(id={self.id}, title='{self.title}', owner_id={self.owner_id})>"

# Association table for many-to-many relationship between Dashboard and Chart
class DashboardChart(Base):
    __tablename__ = "dashboard_charts"
    dashboard_id: Mapped[int] = mapped_column(ForeignKey("dashboards.id"), primary_key=True)
    chart_id: Mapped[int] = mapped_column(ForeignKey("charts.id"), primary_key=True)
    # Additional attributes for the association, e.g., position on dashboard
    position_x: Mapped[int] = mapped_column(default=0)
    position_y: Mapped[int] = mapped_column(default=0)
    width: Mapped[int] = mapped_column(default=6)
    height: Mapped[int] = mapped_column(default=4)

    def __repr__(self):
        return f"<DashboardChart(dashboard_id={self.dashboard_id}, chart_id={self.chart_id})>"
```