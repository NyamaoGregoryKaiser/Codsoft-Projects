import pytest
import os
from app import create_app, db
from app.models import User, Project, Task
from flask_jwt_extended import create_access_token
from datetime import datetime, timedelta

@pytest.fixture(scope='session')
def flask_app():
    """Create a test Flask application instance."""
    app = create_app('testing')
    with app.app_context():
        yield app

@pytest.fixture(scope='session')
def client(flask_app):
    """A test client for the app."""
    return flask_app.test_client()

@pytest.fixture(scope='session')
def test_db(flask_app):
    """Set up and tear down a fresh database for testing."""
    with flask_app.app_context():
        db.create_all()
        yield db
        db.session.remove()
        db.drop_all()

@pytest.fixture(scope='function')
def session(test_db):
    """Provide a transactional scope around each test function."""
    connection = test_db.engine.connect()
    transaction = connection.begin()
    options = dict(bind=connection, binds={})
    session = test_db.create_scoped_session(options=options)
    test_db.session = session
    yield session
    session.remove()
    transaction.rollback()
    connection.close()

@pytest.fixture(scope='function')
def admin_user(session):
    """Create an admin user for testing."""
    admin = User(username='testadmin', email='testadmin@example.com', password='password', is_admin=True)
    session.add(admin)
    session.commit()
    return admin

@pytest.fixture(scope='function')
def regular_user(session):
    """Create a regular user for testing."""
    user = User(username='testuser', email='testuser@example.com', password='password')
    session.add(user)
    session.commit()
    return user

@pytest.fixture(scope='function')
def another_user(session):
    """Create another regular user for testing."""
    user = User(username='anotheruser', email='another@example.com', password='password')
    session.add(user)
    session.commit()
    return user


@pytest.fixture(scope='function')
def admin_auth_headers(flask_app, admin_user):
    """Authentication headers for the admin user."""
    with flask_app.app_context():
        access_token = create_access_token(identity=admin_user.id, additional_claims={"is_admin": True})
    return {'Authorization': f'Bearer {access_token}'}

@pytest.fixture(scope='function')
def user_auth_headers(flask_app, regular_user):
    """Authentication headers for the regular user."""
    with flask_app.app_context():
        access_token = create_access_token(identity=regular_user.id, additional_claims={"is_admin": False})
    return {'Authorization': f'Bearer {access_token}'}

@pytest.fixture(scope='function')
def auth_client(client, user_auth_headers):
    """A test client with authentication headers for a regular user."""
    client.environ_base['HTTP_AUTHORIZATION'] = user_auth_headers['Authorization']
    return client

@pytest.fixture(scope='function')
def admin_client(client, admin_auth_headers):
    """A test client with authentication headers for an admin user."""
    client.environ_base['HTTP_AUTHORIZATION'] = admin_auth_headers['Authorization']
    return client

@pytest.fixture(scope='function')
def user_project(session, regular_user):
    """Create a project owned by the regular user."""
    project = Project(name='User Project', description='A project for the regular user.', owner=regular_user)
    session.add(project)
    session.commit()
    return project

@pytest.fixture(scope='function')
def another_user_project(session, another_user):
    """Create a project owned by another user."""
    project = Project(name='Another User Project', description='A project for another user.', owner=another_user)
    session.add(project)
    session.commit()
    return project

@pytest.fixture(scope='function')
def user_task(session, user_project, regular_user):
    """Create a task for the user's project."""
    task = Task(title='User Task', project=user_project, assignee=regular_user, status='todo', priority='medium')
    session.add(task)
    session.commit()
    return task

@pytest.fixture(scope='function')
def another_user_task(session, another_user_project, another_user):
    """Create a task for another user's project."""
    task = Task(title='Another User Task', project=another_user_project, assignee=another_user, status='todo', priority='medium')
    session.add(task)
    session.commit()
    return task
```