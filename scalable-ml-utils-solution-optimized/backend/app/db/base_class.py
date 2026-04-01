```python
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import text
from datetime import datetime
from typing import Annotated

# Define a common type for primary key
intpk = Annotated[int, mapped_column(primary_key=True, index=True)]
created_at = Annotated[datetime, mapped_column(default=datetime.utcnow, server_default=text("now()"))]
updated_at = Annotated[datetime, mapped_column(default=datetime.utcnow, onupdate=datetime.utcnow, server_default=text("now()"))]

class Base(DeclarativeBase):
    """
    Base class which provides automated primary key, created_at, and updated_at fields.
    """
    id: Mapped[intpk]
    created_at: Mapped[created_at]
    updated_at: Mapped[updated_at]
```