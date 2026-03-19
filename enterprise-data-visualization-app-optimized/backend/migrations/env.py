```python
from logging.config import fileConfig
import os
from alembic import context
from sqlalchemy import engine_from_config, pool

# This is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
# from myapp import Base
# target_metadata = Base.metadata
from app import db # Import the db instance from your Flask application
from app.models import user, datasource, dashboard, visualization # Import all your models

target_metadata = db.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.

def get_db_url():
    """Retrieve database URL from environment or Flask config."""
    # This logic assumes you have a way to access Flask's configuration
    # or environment variables where the DATABASE_URL is set.
    # For Alembic to work standalone, it often needs its own way to get this.
    # We'll use os.environ directly here, mimicking how `config.py` uses it.
    # In a real setup, you might import `app.config.Config` directly or use python-dotenv.
    return os.environ.get('DATABASE_URL', 'postgresql://user:password@localhost:5432/vizcraft_db')

def run_migrations_offline():
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is still acceptable
    here.  By skipping the Engine creation we don't even need a
    DBAPI to be available.

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

    In this scenario, we need to create an Engine
    and associate a connection with the context.

    """
    configuration = config.get_section(config.config_ini_section)
    configuration['sqlalchemy.url'] = get_db_url() # Set the dynamic DB URL
    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            # Add compare_type=True for better autogenerate detection of type changes
            compare_type=True
        )

        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```