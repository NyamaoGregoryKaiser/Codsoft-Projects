from sqlalchemy.orm import declarative_base, declared_attr
from sqlalchemy import Column, DateTime, func
from datetime import datetime

class CustomBase:
    """Base class which provides automated table name
    and common columns like created_at, updated_at."""

    @declared_attr
    def __tablename__(cls) -> str:
        return cls.__name__.lower() + "s" # pluralize table names

    id: int # type: ignore

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

Base = declarative_base(cls=CustomBase)