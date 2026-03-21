from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool

from app.core.config import settings

# Async engine
engine = create_async_engine(
    settings.DATABASE_URL,
    poolclass=QueuePool, # Use QueuePool for better connection management with async
    pool_size=10,        # Max connections in pool
    max_overflow=20,     # Max extra connections if pool is full
    echo=False           # Set to True to see SQL queries in logs
)

# Async session factory
AsyncSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False, # Prevent instances from expiring after commit
)

# Dependency to get an async database session
async def get_db_session():
    async with AsyncSessionLocal() as session:
        yield session

# Dependency to get an async database session for tests
async def get_test_db_session():
    async with AsyncSessionLocal() as session:
        yield session