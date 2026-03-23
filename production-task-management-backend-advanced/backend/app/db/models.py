from enum import Enum
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.db.base import Base, TimestampMixin

class UserRole(str, Enum):
    USER = "user"
    ADMIN = "admin"

class TaskStatus(str, Enum):
    OPEN = "Open"
    IN_PROGRESS = "In Progress"
    REVIEW = "Review"
    DONE = "Done"

class TaskPriority(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    URGENT = "Urgent"

class User(Base, TimestampMixin):
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, index=True)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    role = Column(SQLEnum(UserRole), default=UserRole.USER, nullable=False)

    projects = relationship("Project", back_populates="owner", lazy="joined")
    tasks_assigned = relationship("Task", back_populates="assignee", lazy="joined")
    tasks_created = relationship("Task", back_populates="creator", lazy="joined", foreign_keys='[Task.creator_id]')
    comments = relationship("Comment", back_populates="author", lazy="joined")

    def __repr__(self):
        return f"<User(email='{self.email}')>"

class Project(Base, TimestampMixin):
    title = Column(String, index=True, nullable=False)
    description = Column(Text)
    owner_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="projects", lazy="joined")
    tasks = relationship("Task", back_populates="project", cascade="all, delete-orphan", lazy="joined")

    def __repr__(self):
        return f"<Project(title='{self.title}')>"

class Task(Base, TimestampMixin):
    title = Column(String, index=True, nullable=False)
    description = Column(Text)
    status = Column(SQLEnum(TaskStatus), default=TaskStatus.OPEN, nullable=False)
    priority = Column(SQLEnum(TaskPriority), default=TaskPriority.MEDIUM, nullable=False)
    due_date = Column(DateTime, nullable=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    assignee_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    creator_id = Column(Integer, ForeignKey("users.id")) # Creator of the task

    project = relationship("Project", back_populates="tasks", lazy="joined")
    assignee = relationship("User", foreign_keys=[assignee_id], back_populates="tasks_assigned", lazy="joined")
    creator = relationship("User", foreign_keys=[creator_id], back_populates="tasks_created", lazy="joined")
    comments = relationship("Comment", back_populates="task", cascade="all, delete-orphan", lazy="joined")

    def __repr__(self):
        return f"<Task(title='{self.title}', status='{self.status}')>"

class Comment(Base, TimestampMixin):
    content = Column(Text, nullable=False)
    task_id = Column(Integer, ForeignKey("tasks.id"))
    author_id = Column(Integer, ForeignKey("users.id"))

    task = relationship("Task", back_populates="comments", lazy="joined")
    author = relationship("User", back_populates="comments", lazy="joined")

    def __repr__(self):
        return f"<Comment(id='{self.id}', task_id='{self.task_id}')>"