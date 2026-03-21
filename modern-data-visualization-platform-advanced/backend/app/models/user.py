```python
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Boolean, String, Text

from app.db.base import Base
from typing import List

class User(Base):
    """
    Represents a user in the system.
    """
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    datasources: Mapped[List["DataSource"]] = relationship("DataSource", back_populates="owner", cascade="all, delete-orphan")
    dashboards: Mapped[List["Dashboard"]] = relationship("Dashboard", back_populates="owner", cascade="all, delete-orphan")
    charts: Mapped[List["Chart"]] = relationship("Chart", back_populates="owner", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}', is_superuser={self.is_superuser})>"
```