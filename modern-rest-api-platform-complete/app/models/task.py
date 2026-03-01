from datetime import datetime, timezone
from enum import Enum as PyEnum
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, text
from sqlalchemy.orm import relationship

from app.models.base import Base

class TaskStatus(str, PyEnum):
    todo = "todo"
    in_progress = "in_progress"
    done = "done"

class TaskPriority(str, PyEnum):
    low = "low"
    medium = "medium"
    high = "high"

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    status = Column(Enum(TaskStatus), default=TaskStatus.todo, server_default=TaskStatus.todo.value, nullable=False)
    priority = Column(Enum(TaskPriority), default=TaskPriority.medium, server_default=TaskPriority.medium.value, nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    assigned_to_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), server_default=text('now()'), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), server_default=text('now()'), nullable=False)

    # Relationships
    project = relationship("Project", back_populates="tasks")
    assigned_to = relationship("User", back_populates="tasks_assigned")
    comments = relationship("Comment", back_populates="task", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Task(id={self.id}, title='{self.title}', status='{self.status}')>"
```