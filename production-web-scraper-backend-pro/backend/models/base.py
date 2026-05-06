```python
from sqlalchemy import Column, DateTime, func
from sqlalchemy.orm import declarative_base

class CustomBase:
    __abstract__ = True
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

Base = declarative_base(cls=CustomBase)
```