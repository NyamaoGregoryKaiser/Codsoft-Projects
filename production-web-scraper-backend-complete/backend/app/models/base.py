from datetime import datetime, timezone
from typing import Any

from sqlalchemy import Column, DateTime, func
from sqlalchemy.orm import declarative_base, declared_attr

# This is the Base for SQLAlchemy models for Alembic
Base = declarative_base()

class TimestampedBase(object):
    """Base class mixin that adds created_at and updated_at timestamps."""

    @declared_attr
    def __tablename__(cls):
        # Generate __tablename__ automatically from class name
        return cls.__name__.lower() + "s"

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    def to_dict(self):
        """Converts an SQLAlchemy model instance to a dictionary."""
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}
```
---