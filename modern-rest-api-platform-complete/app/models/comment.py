from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, text
from sqlalchemy.orm import relationship

from app.models.base import Base

class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True)
    content = Column(String, nullable=False)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), server_default=text('now()'), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), server_default=text('now()'), nullable=False)

    # Relationships
    task = relationship("Task", back_populates="comments")
    author = relationship("User", back_populates="comments")

    def __repr__(self):
        return f"<Comment(id={self.id}, task_id={self.task_id}, author_id={self.author_id})>"
```