from typing import TYPE_CHECKING
from sqlalchemy import Column, Integer, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.task import Task
    from app.models.user import User

class TaskComment(Base):
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    comment_text: Mapped[str] = mapped_column(Text, nullable=False)

    task_id: Mapped[int] = mapped_column(Integer, ForeignKey("tasks.id"), nullable=False)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)

    # Relationships
    task: Mapped["Task"] = relationship("Task", back_populates="comments")
    user: Mapped["User"] = relationship("User", back_populates="comments")

    def __repr__(self):
        return f"<TaskComment(id={self.id}, task_id={self.task_id}, user_id={self.user_id})>"