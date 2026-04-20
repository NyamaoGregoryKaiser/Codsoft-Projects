from sqlalchemy.ext.asyncio import AsyncAttrs
from sqlalchemy.orm import declarative_base

# The base class for our ORM models
Base = declarative_base()

class BaseModel(AsyncAttrs, Base):
    """Base class that combines declarative_base with AsyncAttrs for async relationships."""
    __abstract__ = True # This tells SQLAlchemy that this is an abstract base class
```

#### `app/models/user.py`
```python