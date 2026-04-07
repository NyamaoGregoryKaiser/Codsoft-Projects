from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import text
from datetime import datetime, timezone
from typing import Annotated

# Define common column types
intpk = Annotated[int, mapped_column(primary_key=True, index=True)]
created_at = Annotated[
    datetime,
    mapped_column(default=lambda: datetime.now(timezone.utc), nullable=False)
]
updated_at = Annotated[
    datetime,
    mapped_column(default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
]
str_50 = Annotated[str, mapped_column(text("VARCHAR(50)"))]
str_255 = Annotated[str, mapped_column(text("VARCHAR(255)"))]
str_text = Annotated[str, mapped_column(text("TEXT"))]


class Base(DeclarativeBase):
    pass