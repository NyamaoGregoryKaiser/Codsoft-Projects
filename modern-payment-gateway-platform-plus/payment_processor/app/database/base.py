from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import Integer

class Base(DeclarativeBase):
    """
    Base class for declarative models.
    """
    pass

# For MappedColumn:
from sqlalchemy.orm import Mapped, mapped_column
```

#### `payment_processor/app/database/engine.py`
```python