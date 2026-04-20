from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.db.base import BaseModel

class Chart(BaseModel):
    __tablename__ = "charts"

    id: int = Column(Integer, primary_key=True, index=True)
    title: str = Column(String, nullable=False)
    description: Text = Column(Text, nullable=True)
    chart_type: str = Column(String, nullable=False) # e.g., "bar", "line", "pie"
    config: dict = Column(JSON, nullable=False, default={}) # Chart.js/Plotly.js config options
    dataset_id: int = Column(Integer, ForeignKey("datasets.id"), nullable=False)
    dashboard_id: int = Column(Integer, ForeignKey("dashboards.id"), nullable=True) # Optional, can be standalone
    owner_id: int = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at: datetime = Column(DateTime, default=datetime.utcnow)
    updated_at: datetime = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    dataset = relationship("Dataset", backref="charts")
    dashboard = relationship("Dashboard", back_populates="charts")
    owner = relationship("User", backref="charts")

    def __repr__(self):
        return f"<Chart(id={self.id}, title='{self.title}', type='{self.chart_type}')>"