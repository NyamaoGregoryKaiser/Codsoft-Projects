import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.core.config import settings
from app.db.base import Base # Import your Base for models
from app.db.session import engine, AsyncSessionLocal
from app.crud.crud_user import user as crud_user
from app.schemas.user import UserCreate

logger = logging.getLogger(__name__)

async def create_tables():
    """Create all tables defined in Base."""
    logger.info("Creating database tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables created.")

async def check_database_exists():
    """Checks if the database exists and creates it if not."""
    db_name = settings.POSTGRES_DB
    user = settings.POSTGRES_USER
    password = settings.POSTGRES_PASSWORD
    host = settings.POSTGRES_SERVER

    # Connect to the default 'postgres' database to check/create
    # Need to construct a temporary connection string
    default_db_url = f"postgresql+asyncpg://{user}:{password}@{host}/postgres"
    default_engine = create_async_engine(default_db_url, isolation_level="AUTOCOMMIT")

    async with default_engine.connect() as conn:
        result = await conn.execute(text(f"SELECT 1 FROM pg_database WHERE datname='{db_name}'"))
        if not result.scalar():
            logger.info(f"Database '{db_name}' does not exist. Creating...")
            try:
                await conn.execute(text(f"CREATE DATABASE {db_name}"))
                logger.info(f"Database '{db_name}' created successfully.")
            except Exception as e:
                logger.error(f"Error creating database {db_name}: {e}")
                raise
        else:
            logger.info(f"Database '{db_name}' already exists.")
    await default_engine.dispose()


async def init_db() -> None:
    """
    Initializes the database: creates tables and superuser if they don't exist.
    """
    # await check_database_exists() # This is handled by docker-compose and 'postgres' service init
    await create_tables()

    async with AsyncSessionLocal() as db:
        # Create a superuser if none exists
        existing_user = await crud_user.get_by_email(db, email=settings.FIRST_SUPERUSER_EMAIL)
        if not existing_user:
            user_in = UserCreate(
                email=settings.FIRST_SUPERUSER_EMAIL,
                password=settings.FIRST_SUPERUSER_PASSWORD,
                first_name=settings.FIRST_SUPERUSER_FIRST_NAME,
                last_name=settings.FIRST_SUPERUSER_LAST_NAME,
                is_superuser=True,
                is_active=True,
                is_verified=True, # Superuser is always verified
            )
            await crud_user.create(db, obj_in=user_in)
            logger.info("Superuser created.")
        else:
            logger.info("Superuser already exists.")
```