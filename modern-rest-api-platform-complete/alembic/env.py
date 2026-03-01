import os
import sys
from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import AsyncEngine

from alembic import context

# This ensures that your application's models can be imported correctly
sys.path.append(os.getcwd())
from app.models.base import Base # Adjust this import based on your base.py location
from app.models import user, project, task, comment # Import all your models here

# Interpret the config file for Python's standard logging.
fileConfig(context.config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
# from myapp import mymodel
# target_metadata = mymodel.Base.metadata
target_metadata = Base.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.

def get_db_url():
    """Retrieve database URL from environment or alembic.ini."""
    # This tries to get the URL from the environment variable DATABASE_URL first
    # This allows Docker Compose to inject the correct URL
    db_url = os.getenv("DATABASE_URL")
    if db_url:
        # Alembic uses the 'sqlalchemy.url' key, so we need to set it in the context config
        context.config.set_main_option("sqlalchemy.url", db_url)
        print(f"Alembic using DATABASE_URL from environment: {db_url}")
    else:
        # Fallback to alembic.ini if not found in environment
        db_url = context.config.get_main_option("sqlalchemy.url")
        print(f"Alembic using sqlalchemy.url from alembic.ini: {db_url}")

    if not db_url:
        raise Exception("DATABASE_URL environment variable or sqlalchemy.url in alembic.ini not set.")
    return db_url

def run_migrations_offline():
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = get_db_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    configuration = context.config.get_section(context.config.config_ini_section)
    configuration["sqlalchemy.url"] = get_db_url()

    connectable = AsyncEngine(
        engine_from_config(
            configuration,
            prefix="sqlalchemy.",
            poolclass=pool.NullPool,
            future=True,
        )
    )

    async def run_async_migrations():
        async with connectable.connect() as connection:
            context.configure(
                connection=connection, target_metadata=target_metadata
            )

            await connection.run_sync(do_run_migrations)

    import asyncio
    asyncio.run(run_async_migrations())


def do_run_migrations(connection):
    context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```