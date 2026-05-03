import click
from flask.cli import with_appcontext
from flask_migrate import Migrate, upgrade as migrate_upgrade, stamp as migrate_stamp
import os

from app.extensions import db
from app.models import User
from app.config import Config

migrate = Migrate()

def init_app_db(app):
    migrate.init_app(app, db)

@click.group()
def init_db_commands():
    """Database management commands."""
    pass

@init_db_commands.command('create')
@with_appcontext
def create_all_command():
    """Creates all database tables."""
    db.create_all()
    click.echo('Database tables created.')

@init_db_commands.command('drop')
@with_appcontext
def drop_all_command():
    """Drops all database tables."""
    db.drop_all()
    click.echo('Database tables dropped.')

@init_db_commands.command('upgrade')
@with_appcontext
def upgrade_command():
    """Applies pending database migrations."""
    click.echo('Running database migrations...')
    migrate_upgrade()
    click.echo('Database migrations applied.')

@init_db_commands.command('seed')
@with_appcontext
def seed_command():
    """Seeds the database with initial data (e.g., admin user)."""
    if User.query.filter_by(username=os.environ.get('ADMIN_USERNAME')).first():
        click.echo('Admin user already exists. Skipping seed.')
        return

    admin_username = os.environ.get('ADMIN_USERNAME', 'admin')
    admin_email = os.environ.get('ADMIN_EMAIL', 'admin@example.com')
    admin_password = os.environ.get('ADMIN_PASSWORD', 'adminpassword')

    admin_user = User(username=admin_username, email=admin_email, is_admin=True)
    admin_user.set_password(admin_password)
    db.session.add(admin_user)
    db.session.commit()
    click.echo(f'Admin user "{admin_username}" seeded successfully.')

@init_db_commands.command('reset')
@with_appcontext
def reset_db_command():
    """Drops all tables, recreates them, applies migrations, and seeds initial data."""
    if input("This will DELETE ALL DATA. Are you sure? (yes/no): ").lower() != 'yes':
        click.echo("Aborted.")
        return

    click.echo('Dropping all tables...')
    db.drop_all()
    click.echo('Creating all tables...')
    db.create_all()
    click.echo('Stamping current migration to head (no actual migrations ran)...')
    migrate_stamp() # Ensure Alembic recognizes current state as up-to-date
    click.echo('Seeding initial data...')
    seed_command()
    click.echo('Database reset and seeded successfully.')

# Ensure that `init_app_db` is called when `create_app` is invoked.
# For Flask-Migrate to work, it needs to be initialized with `app` and `db`.
# This is typically done in app/__init__.py
```