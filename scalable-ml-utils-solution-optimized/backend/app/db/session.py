```python
import asyncio
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from backend.app.core.config import settings

# Use psycopg2 (synchronous) for Alembic and init_db, but asyncpg for the application
# create_async_engine uses asyncpg by default if DATABASE_URL starts with 'postgresql+asyncpg'
# For compatibility with psycopg2-binary in Alembic, we use postgresql+psycopg2 for sync operations
# and explicitly use asyncpg for async. Or, as FastAPI suggests, use postgresql+asyncpg
# and ensure asyncpg is installed. Let's stick to asyncpg for async ops.

# For Alembic, the alembic.ini needs to reference the DATABASE_URL that includes psycopg2.
# For the application, we explicitly use asyncpg.

ASYNC_DATABASE_URL = settings.DATABASE_URL.replace("postgresql+psycopg2", "postgresql+asyncpg")

engine = create_async_engine(
    ASYNC_DATABASE_URL,
    pool_pre_ping=True,
    echo=False # Set to True for SQL logging
)

AsyncSessionLocal = async_sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False # Prevent SQLA from trying to load stale objects after commit
)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session

# This synchronous engine is ONLY for Alembic's env.py if it needs to inspect the database
# or for synchronous operations like init_db that are outside the async FastAPI app flow.
# In a fully async application, you'd typically remove direct sync usage,
# or handle it carefully. For init_db, we'll make it async.
# So, no need for a separate sync engine.

```