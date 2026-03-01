from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, text
from sqlalchemy.orm import relationship

from app.models.base import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True, server_default=text('true'), nullable=False)
    is_admin = Column(Boolean, default=False, server_default=text('false'), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), server_default=text('now()'), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), server_default=text('now()'), nullable=False)

    # Relationships
    projects = relationship("Project", back_populates="owner")
    tasks_assigned = relationship("Task", back_populates="assigned_to")
    comments = relationship("Comment", back_populates="author")

    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}')>"
```