import enum
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin
from app.models.user import User

class TaskStatus(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class ScrapingTask(TimestampMixin, Base):
    __tablename__ = "scraping_tasks"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    target_url = Column(String, nullable=False)
    css_selector = Column(Text, nullable=True) # JSON string or comma-separated for multiple
    frequency_seconds = Column(Integer, default=3600) # How often to run, e.g., hourly
    last_run_at = Column(TimestampMixin.created_at.type, nullable=True) # Use same type as created_at
    next_run_at = Column(TimestampMixin.created_at.type, nullable=True)
    status = Column(Enum(TaskStatus), default=TaskStatus.PENDING, nullable=False)
    is_active = Column(Boolean, default=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    owner = relationship("User", back_populates="tasks")
    results = relationship("ScrapingResult", back_populates="task", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<ScrapingTask(id={self.id}, name='{self.name}', status='{self.status}')>"
```