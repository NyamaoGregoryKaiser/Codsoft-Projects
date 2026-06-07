```python
import datetime
from typing import Any

from sqlalchemy import Column, DateTime, func
from sqlalchemy.orm import declarative_base

# Base class for all SQLAlchemy declarative models.
# It includes common columns like 'created_at' and 'updated_at'.
class CustomBase:
    """
    Custom base class providing common fields for all models.
    """
    __abstract__ = True  # Marks this class as abstract, not for table creation

    id: Any  # Type hint for the primary key, typically an Integer

    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)


# The actual declarative base for models
Base = declarative_base(cls=CustomBase)

```