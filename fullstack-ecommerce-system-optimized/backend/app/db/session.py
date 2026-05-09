```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

# Create the SQLAlchemy engine
# Use `pool_pre_ping=True` to ensure connections are still alive
engine = create_engine(
    str(settings.SQLALCHEMY_DATABASE_URL), pool_pre_ping=True
)

# Create a SessionLocal class for database sessions
# `autocommit=False` means changes are not immediately written to the DB
# `autoflush=False` disables automatic flushing of changes to the DB before queries
# `bind=engine` associates the session with our database engine
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

```