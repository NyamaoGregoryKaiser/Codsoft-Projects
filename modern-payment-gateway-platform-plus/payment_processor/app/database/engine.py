from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

# Async engine for PostgreSQL
async_engine = create_async_engine(settings.DATABASE_URL, echo=False, future=True, pool_pre_ping=True, pool_size=10, max_overflow=20)

# Async session maker
AsyncSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

```

#### `payment_processor/alembic.ini`
```ini