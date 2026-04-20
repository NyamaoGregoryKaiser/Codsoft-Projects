from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.db.base import BaseModel

class Dataset(BaseModel):
    __tablename__ = "datasets"

    id: int = Column(Integer, primary_key=True, index=True)
    name: str = Column(String, index=True, nullable=False)
    description: Text = Column(Text, nullable=True)
    source_type: str = Column(String, nullable=False) # e.g., "csv", "sql_query", "api"
    source_config: dict = Column(JSON, nullable=False, default={}) # e.g., {"file_path": "/data/my.csv"}, {"query": "SELECT * FROM sales"}
    owner_id: int = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at: datetime = Column(DateTime, default=datetime.utcnow)
    updated_at: datetime = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner = relationship("User", backref="datasets") # This assumes User model is defined

    def __repr__(self):
        return f"<Dataset(id={self.id}, name='{self.name}', source_type='{self.source_type}')>"