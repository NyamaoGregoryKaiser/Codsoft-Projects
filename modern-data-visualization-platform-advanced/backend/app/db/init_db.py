```python
import logging

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from app.db.base import Base # Import Base to ensure models are registered
from app.db.session import engine, AsyncSessionLocal
from app.crud.users import crud_user
from app.schemas.user import UserCreate
from app.core.config import settings

logger = logging.getLogger(__name__)

async def init_db_data():
    """
    Initializes the database schema and seeds initial data.
    This function is primarily for local development/testing or on first deploy.
    In a production environment, Alembic migrations should be run explicitly.
    """
    logger.info("Checking for database initialization...")

    async with engine.begin() as conn:
        # Check if tables exist (simple heuristic for init_db_data)
        inspector = await conn.run_sync(engine.inspector)
        if not await inspector.has_table("users"):
            logger.info("Tables not found, creating all database tables...")
            await conn.run_sync(Base.metadata.create_all)
            logger.info("Database tables created.")
            await seed_initial_data(AsyncSessionLocal())
        else:
            logger.info("Database tables already exist. Skipping creation.")
            # Still attempt to seed if specific data might be missing (e.g., admin user)
            await seed_initial_data(AsyncSessionLocal())


async def seed_initial_data(db: AsyncSession):
    """
    Seeds initial data into the database, such as an admin user.
    """
    logger.info("Seeding initial data...")
    try:
        admin_user = await crud_user.get_by_email(db, email=settings.FIRST_SUPERUSER_EMAIL)
        if not admin_user:
            user_in = UserCreate(
                email=settings.FIRST_SUPERUSER_EMAIL,
                password=settings.FIRST_SUPERUSER_PASSWORD,
                is_superuser=True,
                full_name="Superuser Admin"
            )
            admin_user = await crud_user.create(db, obj_in=user_in)
            logger.info(f"Created initial superuser: {admin_user.email}")
        else:
            logger.info(f"Superuser '{admin_user.email}' already exists.")

        # Add more seed data here if necessary (e.g., default data sources, dashboards)
        # Example:
        # if not await crud_datasource.get_by_name(db, name="Demo Database"):
        #     await crud_datasource.create(db, obj_in=DataSourceCreate(name="Demo Database", type="PostgreSQL", ...))

        await db.commit()
        logger.info("Initial data seeding complete.")
    except IntegrityError:
        await db.rollback()
        logger.warning("IntegrityError during seeding, likely data already exists. Rolling back.")
    except Exception as e:
        await db.rollback()
        logger.error(f"Error seeding initial data: {e}", exc_info=True)

# This script can be run directly if needed for initial setup:
# python -m app.db.init_db
if __name__ == "__main__":
    import asyncio
    asyncio.run(init_db_data())
```