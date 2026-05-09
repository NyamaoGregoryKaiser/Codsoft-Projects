```python
import os
import sys
from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

# This is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python's standard logging.
# This ensures that loggers are set up correctly.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Add your model's base to the import path here.
# For example, if your models are in 'app.db.base', you'd do:
sys.path.append(os.path.join(os.path.dirname(__file__), '..')) # Adjust path to point to your project root
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'app')) 

from app.db.base import Base  # Import your SQLAlchemy Base
from app.core.config import settings # Import your settings

target_metadata = Base # Set target_metadata to your Base


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is still acceptable
    here as long as migrations are not actually attempted to be executed
    via the Alembic API. Whenever we run migrations this way, we want to
    ensure that our connection string comes from the current runtime
    environment (via settings), not from the alembic.ini config file.
    """
    url = str(settings.SQLALCHEMY_DATABASE_URL)
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario, we need to create an Engine
    and associate a connection with the context.
    """
    configuration = config.get_section(config.config_ini_section)
    configuration["sqlalchemy.url"] = str(settings.SQLALCHEMY_DATABASE_URL) # Override from settings

    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()

```