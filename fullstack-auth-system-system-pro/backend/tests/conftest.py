import pytest
import os
from dotenv import load_dotenv

# Load environment variables for testing, if any specific ones are needed
load_dotenv(override=True)

from backend.app import create_app
from backend.app.config import TestingConfig
from backend.app.extensions import db as _db
from backend.app.models.user import User, Role
from backend.app.models.token_blacklist import TokenBlacklist

@pytest.fixture(scope='session')
def app():
    """Session-wide application fixture."""
    _app = create_app(TestingConfig)

    # Establish an application context before running the tests.
    ctx = _app.app_context()
    ctx.push()

    yield _app

    ctx.pop()

@pytest.fixture(scope='session')
def db(app):
    """Session-wide test database."""
    with app.app_context():
        _db.create_all()

        # Seed roles
        admin_role = Role(name='Admin', description='Administrator role')
        user_role = Role(name='User', description='Standard user role')
        _db.session.add_all([admin_role, user_role])
        _db.session.commit()

        yield _db

        _db.session.remove()
        _db.drop_all()

@pytest.fixture(scope='function')
def session(db):
    """Scoped database session for each test function."""
    connection = db.engine.connect()
    transaction = connection.begin()

    options = dict(bind=connection, binds={})
    session = db.create_scoped_session(options=options)
    db.session = session # Bind to db.session for services

    # Seed data specific to some tests (can be moved to individual tests if very specific)
    admin_role = db.session.scalar(db.select(Role).filter_by(name='Admin'))
    user_role = db.session.scalar(db.select(Role).filter_by(name='User'))
    
    admin_user = User(username='admin', email='admin@example.com', password='AdminPassword123!', role_name='Admin')
    test_user = User(username='testuser', email='test@example.com', password='TestPassword123!', role_name='User')
    
    db.session.add_all([admin_user, test_user])
    db.session.commit()

    # Clear current session after seeding
    db.session.expunge_all() 
    db.session.close()

    yield session

    transaction.rollback()
    connection.close()
    session.remove()

@pytest.fixture(scope='function')
def client(app, session):
    """A test client for the app."""
    return app.test_client()

@pytest.fixture(scope='function')
def runner(app):
    """A test runner for the app's Click commands."""
    return app.test_cli_runner()

@pytest.fixture(scope='function')
def auth_headers(client, session):
    """Fixture to get authentication headers for a test user."""
    with client.application.app_context():
        user = session.scalar(db.select(User).filter_by(username='testuser'))
        response = client.post(
            '/api/auth/login',
            json={'email': user.email, 'password': 'TestPassword123!'}
        )
        data = response.json
        access_token = data['access_token']
        refresh_token = data['refresh_token']
        return {
            'Authorization': f'Bearer {access_token}',
            'X-Refresh-Token': refresh_token # Custom header for refresh in logout
        }

@pytest.fixture(scope='function')
def admin_auth_headers(client, session):
    """Fixture to get authentication headers for an admin user."""
    with client.application.app_context():
        admin = session.scalar(db.select(User).filter_by(username='admin'))
        response = client.post(
            '/api/auth/login',
            json={'email': admin.email, 'password': 'AdminPassword123!'}
        )
        data = response.json
        access_token = data['access_token']
        refresh_token = data['refresh_token']
        return {
            'Authorization': f'Bearer {access_token}',
            'X-Refresh-Token': refresh_token
        }
```