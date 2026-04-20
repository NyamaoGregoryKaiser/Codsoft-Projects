from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.db.base import BaseModel

class Dashboard(BaseModel):
    __tablename__ = "dashboards"

    id: int = Column(Integer, primary_key=True, index=True)
    title: str = Column(String, index=True, nullable=False)
    description: Text = Column(Text, nullable=True)
    owner_id: int = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at: datetime = Column(DateTime, default=datetime.utcnow)
    updated_at: datetime = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner = relationship("User", backref="dashboards")
    charts = relationship("Chart", back_populates="dashboard", cascade="all, delete-orphan") # One-to-many with charts

    def __repr__(self):
        return f"<Dashboard(id={self.id}, title='{self.title}')>"