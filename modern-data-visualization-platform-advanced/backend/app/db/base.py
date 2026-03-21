```python
from sqlalchemy.ext.asyncio import AsyncAttrs
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import text
from datetime import datetime

class Base(AsyncAttrs, DeclarativeBase):
    """
    Base class which provides automated table name
    and common columns like id, created_at, updated_at.
    """
    __abstract__ = True
    __name__: str

    # Generate __tablename__ automatically
    @classmethod
    def __table_name__(cls) -> str:
        return cls.__name__.lower() + "s"

    id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    created_at: Mapped[datetime] = mapped_column(
        default=datetime.utcnow,
        server_default=text("TIMEZONE('utc', now())"),
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        server_default=text("TIMEZONE('utc', now())"),
        nullable=False
    )

    def __repr__(self):
        return f"<{self.__class__.__name__}(id={self.id})>"

# Import all models here so that Alembic can discover them
from app.models.user import User
from app.models.datasource import DataSource
from app.models.dashboard import Dashboard
from app.models.chart import Chart
```