from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

# Import your Base metadata here for auto-generating migrations
from backend.app.extensions import db
from backend.app.models.user import User
from backend.app.models.role import Role
from backend.app.models.token_blacklist import TokenBlacklist
from backend.app.models.post import Post

target_metadata = db.Model.metadata # This is crucial for autogeneration

# ... rest of Alembic generated env.py ...
# (Typically you'd configure sqlalchemy.url and other settings here or via env vars)

def run_migrations_online():
    """Run migrations in 'online' mode."""
    configuration = context.config
    # This captures the above set of just-imported objects above.
    # It allows us to set up environment variables for the database URL.
    connectable = engine_from_config(
        configuration.get_section(configuration.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    # Use the DATABASE_URL environment variable for migrations
    if "DATABASE_URL" in os.environ:
        connectable.url = os.environ["DATABASE_URL"]

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True, # Important for detecting type changes
            # Add custom seed data command here if needed for post-migration ops
            # on_after_update=seed_data,
        )

        with context.begin_transaction():
            context.run_migrations()

# ... rest of Alembic generated env.py ...
# seed_data function example (would be more complex for real data)
def seed_data():
    bind = op.get_bind()
    session = orm.Session(bind=bind)
    if not session.query(Role).filter_by(name='Admin').first():
        admin_role = Role(name='Admin', description='Administrator role')
        session.add(admin_role)
    if not session.query(Role).filter_by(name='User').first():
        user_role = Role(name='User', description='Standard user role')
        session.add(user_role)
    session.commit()
    # You might want to create an initial admin user here
    # if not session.query(User).filter_by(username='admin').first():
    #     admin_user = User(username='admin', email='admin@example.com', password='adminpassword', role_name='Admin')
    #     session.add(admin_user)
    #     session.commit()
    # current_app.logger.info("Database seeded with initial roles and admin user.")

# Make sure `seed_data` is called after migrations.
# You might add it as a hook in `script.py.mako` or call it manually after `alembic upgrade head`.
# A more robust approach for seeding is to use a dedicated script or a Flask CLI command.
```