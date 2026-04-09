```python
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

# Create an async engine
engine = create_async_engine(settings.DATABASE_URL, echo=False, future=True)

# Create a sessionmaker
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False, # Important for retaining objects after commit
)

async def init_db():
    # This function is primarily to ensure the engine is created and connections can be made
    # For schema creation/migration, Alembic is used.
    # In a real app, you might run a simple query here to test connectivity.
    pass

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        yield session
```