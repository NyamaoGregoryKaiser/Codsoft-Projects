```python
from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

# this is the Alembic Config object, which provides
# access to values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
from backend.app.models.user import User
from backend.app.models.database import DatabaseConnection, QueryLog, SchemaChange
from backend.app.extensions import db as _db_instance # Import db from extensions

target_metadata = _db_instance.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired a stand-in for the application's environment.
# for example, it's useful to provide an application context that uses
# the same DB object as the main app.
from flask import current_app
if current_app:
    config.set_main_option('sqlalchemy.url', current_app.config.get('SQLALCHEMY_DATABASE_URI'))
else:
    # Fallback for when current_app is not available (e.g., direct alembic run without Flask app context)
    # This URL should match the one in .env or config.py
    import os
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '.env'))
    config.set_main_option('sqlalchemy.url', os.environ.get('DATABASE_URL', 'postgresql://user:password@localhost:5433/dboptiflow_db'))


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is still acceptable
    here.  By skipping the Engine creation we don't even need
    a database to begin with.  Create the engine symbolically to
    enable declarative use of environments for module imports
    and otherwise configure one.

    """
    url = config.get_main_option("sqlalchemy.url")
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
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
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