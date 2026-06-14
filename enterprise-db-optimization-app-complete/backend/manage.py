```python
import os
import click
from dotenv import load_dotenv
from flask.cli import FlaskGroup
from backend.app import create_app
from backend.app.extensions import db
from backend.app.models.user import User
from backend.app.models.database import DatabaseConnection, QueryLog, SchemaChange

# Load environment variables from .env file
load_dotenv()

def create_dboptiflow_app(info):
    """Callback function for FlaskGroup to create the app."""
    return create_app(os.getenv('FLASK_ENV', 'development'))

@click.group(cls=FlaskGroup, create_app=create_dboptiflow_app)
def cli():
    """Main entry point for CLI commands."""
    pass

@cli.command('seed')
@click.option('--admin-username', default='admin', help='Admin username.')
@click.option('--admin-email', default='admin@dboptiflow.com', help='Admin email.')
@click.option('--admin-password', default='adminpass', help='Admin password.')
def seed_db(admin_username, admin_email, admin_password):
    """Seeds the database with initial data."""
    with db.session.begin_nested():
        if not User.query.filter_by(username=admin_username).first():
            admin_user = User(username=admin_username, email=admin_email,
                              password=admin_password, is_admin=True)
            db.session.add(admin_user)
            db.session.commit()
            click.echo(f"Admin user '{admin_username}' created.")
        else:
            click.echo(f"Admin user '{admin_username}' already exists.")
    click.echo("Database seeding complete.")

@cli.command('reset-db')
@click.confirmation_option(prompt='Are you sure you want to drop all existing data and recreate the database?')
def reset_db():
    """Drops all tables and recreates them, then seeds the database."""
    click.echo("Dropping all database tables...")
    db.drop_all()
    click.echo("Creating all database tables...")
    db.create_all()
    click.echo("Database reset complete. Now seeding...")
    seed_db() # Call seed command after recreation

if __name