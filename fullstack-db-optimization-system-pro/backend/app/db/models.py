from sqlalchemy import Boolean, Column, Integer, String, Text, ForeignKey, Enum, DateTime, JSON, Float
from sqlalchemy.orm import relationship, Mapped, mapped_column
from app.db.base import Base, intpk, created_at, updated_at, str_50, str_255, str_text
import enum
from datetime import datetime, timezone

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    USER = "user"

class DatabaseType(str, enum.Enum):
    POSTGRESQL = "postgresql"
    MYSQL = "mysql"
    SQLSERVER = "sqlserver"
    ORACLE = "oracle"

class SuggestionType(str, enum.Enum):
    INDEX = "index_creation"
    QUERY_REWRITE = "query_rewrite"
    CONFIGURATION = "configuration_tune"
    SHARDING = "sharding"
    PARTITIONING = "partitioning"

class TaskStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class User(Base):
    __tablename__ = "users"

    id: Mapped[intpk]
    username: Mapped[str_50] = mapped_column(unique=True, index=True)
    email: Mapped[str_255] = mapped_column(unique=True, index=True)
    hashed_password: Mapped[str_255]
    full_name: Mapped[Optional[str_255]]
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.USER)
    created_at: Mapped[created_at]
    updated_at: Mapped[updated_at]

    databases: Mapped[list["Database"]] = relationship(back_populates="owner", cascade="all, delete-orphan")
    tasks: Mapped[list["Task"]] = relationship(back_populates="assigned_to", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<User(id={self.id}, username='{self.username}', role='{self.role}')>"

class Database(Base):
    __tablename__ = "databases"

    id: Mapped[intpk]
    name: Mapped[str_50] = mapped_column(index=True)
    db_type: Mapped[DatabaseType] = mapped_column(Enum(DatabaseType), default=DatabaseType.POSTGRESQL)
    host: Mapped[str_255]
    port: Mapped[int]
    db_name: Mapped[str_50]
    username: Mapped[str_50]
    # In a real app, password would be securely stored (e.g., KMS, Vault)
    password: Mapped[str_255]
    description: Mapped[Optional[str_text]]
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[created_at]
    updated_at: Mapped[updated_at]

    owner: Mapped["User"] = relationship(back_populates="databases")
    metrics: Mapped[list["Metric"]] = relationship(back_populates="database", cascade="all, delete-orphan")
    suggestions: Mapped[list["OptimizationSuggestion"]] = relationship(back_populates="database", cascade="all, delete-orphan")
    tasks: Mapped[list["Task"]] = relationship(back_populates="database", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Database(id={self.id}, name='{self.name}', type='{self.db_type}')>"

class Metric(Base):
    __tablename__ = "metrics"

    id: Mapped[intpk]
    database_id: Mapped[int] = mapped_column(ForeignKey("databases.id"))
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    cpu_usage_percent: Mapped[float] = mapped_column(Float, default=0.0)
    memory_usage_percent: Mapped[float] = mapped_column(Float, default=0.0)
    disk_io_ops_sec: Mapped[float] = mapped_column(Float, default=0.0)
    active_connections: Mapped[int] = mapped_column(Integer, default=0)
    total_queries_sec: Mapped[float] = mapped_column(Float, default=0.0)
    avg_query_latency_ms: Mapped[float] = mapped_column(Float, default=0.0)
    # Store query logs or slow queries in JSON
    slow_queries_json: Mapped[Optional[dict]] = mapped_column(JSON, default=dict)
    custom_metrics_json: Mapped[Optional[dict]] = mapped_column(JSON, default=dict)

    database: Mapped["Database"] = relationship(back_populates="metrics")

    def __repr__(self) -> str:
        return f"<Metric(id={self.id}, db_id={self.database_id}, timestamp='{self.timestamp}')>"


class OptimizationSuggestion(Base):
    __tablename__ = "optimization_suggestions"

    id: Mapped[intpk]
    database_id: Mapped[int] = mapped_column(ForeignKey("databases.id"))
    suggested_by_id: Mapped[int] = mapped_column(ForeignKey("users.id")) # Who generated/approved the suggestion
    suggestion_type: Mapped[SuggestionType] = mapped_column(Enum(SuggestionType))
    description: Mapped[str_text]
    sql_command: Mapped[Optional[str_text]] # e.g., 'CREATE INDEX ...'
    impact_estimate: Mapped[Optional[str]] # e.g., 'High', 'Medium', 'Low'
    is_approved: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[created_at]
    updated_at: Mapped[updated_at]

    database: Mapped["Database"] = relationship(back_populates="suggestions")
    suggested_by: Mapped["User"] = relationship(foreign_keys=[suggested_by_id])
    task: Mapped[Optional["Task"]] = relationship(back_populates="suggestion", uselist=False)

    def __repr__(self) -> str:
        return f"<Suggestion(id={self.id}, db_id={self.database_id}, type='{self.suggestion_type}')>"


class Task(Base):
    __tablename__ = "optimization_tasks"

    id: Mapped[intpk]
    database_id: Mapped[int] = mapped_column(ForeignKey("databases.id"))
    suggestion_id: Mapped[Optional[int]] = mapped_column(ForeignKey("optimization_suggestions.id"), unique=True)
    assigned_to_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"))
    title: Mapped[str_255]
    description: Mapped[Optional[str_text]]
    status: Mapped[TaskStatus] = mapped_column(Enum(TaskStatus), default=TaskStatus.PENDING)
    priority: Mapped[str_50] # e.g., High, Medium, Low
    due_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[created_at]
    updated_at: Mapped[updated_at]

    database: Mapped["Database"] = relationship(back_populates="tasks")
    suggestion: Mapped[Optional["OptimizationSuggestion"]] = relationship(back_populates="task")
    assigned_to: Mapped[Optional["User"]] = relationship(back_populates="tasks")

    def __repr__(self) -> str:
        return f"<Task(id={self.id}, title='{self.title}', status='{self.status}')>"

# Import all models here for Alembic to pick them up
# from app.db.models import User, Database, Metric, OptimizationSuggestion, Task