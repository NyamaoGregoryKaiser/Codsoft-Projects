```python
import pytest
import os
from dotenv import load_dotenv

# Load environment variables for tests
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '.env'))

from backend.app import create_app
from backend.app.config import TestingConfig
from backend.app.extensions import db as _db
from backend.app.models import User, Role, DataSource, Visualization, Dashboard
from backend.app.auth.services import AuthService
import json

@pytest.fixture(scope='session')
def app():
    """Session-wide test `Flask` application."""
    app = create_app(TestingConfig)
    # Establish an application context before running tests.
    ctx = app.app_context()
    ctx.push()

    yield app

    ctx.pop()

@pytest.fixture(scope='session')
def client(app):
    """A test client for the app."""
    return app.test_client()

@pytest.fixture(scope='session')
def db(app):
    """Session-wide test database."""
    with app.app_context():
        _db.create_all()
        # Seed roles for testing
        admin_role = Role(name='admin', description='Administrator')
        editor_role = Role(name='editor', description='Editor')
        user_role = Role(name='user', description='Regular User')
        _db.session.add_all([admin_role, editor_role, user_role])
        _db.session.commit()
        yield _db
        _db.drop_all()

@pytest.fixture(scope='function')
def session(db):
    """Creates a new database session for each test."""
    connection = db.engine.connect()
    transaction = connection.begin()
    options = dict(bind=connection, binds={})
    session = db.create_scoped_session(options=options)

    db.session = session
    yield session

    transaction.rollback()
    connection.close()
    session.remove()

@pytest.fixture(scope='function')
def auth_users(session):
    """Fixture to create and return authenticated users for tests."""
    admin_user = AuthService.register_user(
        'test_admin', 'admin@test.com', 'testpass', ['admin', 'editor']
    )
    editor_user = AuthService.register_user(
        'test_editor', 'editor@test.com', 'testpass', ['editor']
    )
    normal_user = AuthService.register_user(
        'test_user', 'user@test.com', 'testpass', ['user']
    )
    return {
        "admin": admin_user,
        "editor": editor_user,
        "user": normal_user
    }

@pytest.fixture(scope='function')
def auth_client(client, auth_users):
    """Fixture to get a client authenticated as a specific user."""
    def _auth_client(username="test_user", password="testpass"):
        resp = client.post('/api/login', json={'username': username, 'password': password})
        assert resp.status_code == 200
        token = resp.json['access_token']
        client.environ_base['HTTP_AUTHORIZATION'] = f'Bearer {token}'
        return client
    return _auth_client

@pytest.fixture(scope='function')
def get_auth_headers(client):
    """Fixture to get auth headers for a specific user."""
    def _get_auth_headers(username="test_user", password="testpass"):
        resp = client.post('/api/login', json={'username': username, 'password': password})
        assert resp.status_code == 200
        token = resp.json['access_token']
        return {'Authorization': f'Bearer {token}'}
    return _get_auth_headers

@pytest.fixture(scope='function')
def create_test_data_source(session, auth_users):
    """Helper to create a data source for tests."""
    def _create_ds(user=None, name="Test DS", type="postgresql", conn_str="postgresql://test:test@localhost:5432/testdb"):
        if not user:
            user = auth_users['editor']
        ds = DataSource(user_id=user.id, name=name, type=type, connection_string=conn_str)
        session.add(ds)
        session.commit()
        return ds
    return _create_ds

@pytest.fixture(scope='function')
def create_test_visualization(session, create_test_data_source, auth_users):
    """Helper to create a visualization for tests."""
    def _create_viz(user=None, ds=None, name="Test Viz", chart_type="bar"):
        if not user:
            user = auth_users['editor']
        if not ds:
            ds = create_test_data_source(user=user)
        viz = Visualization(
            user_id=user.id,
            name=name,
            description="A test visualization",
            chart_type=chart_type,
            query_config={'query_string': 'SELECT * FROM test_table'},
            chart_config={'title': 'Test Chart'},
            data_source_id=ds.id
        )
        session.add(viz)
        session.commit()
        return viz
    return _create_viz

@pytest.fixture(scope='function')
def create_test_dashboard(session, create_test_visualization, auth_users):
    """Helper to create a dashboard for tests."""
    def _create_dash(user=None, viz=None, name="Test Dashboard"):
        if not user:
            user = auth_users['editor']
        if not viz:
            viz = create_test_visualization(user=user)
        dash = Dashboard(
            user_id=user.id,
            name=name,
            description="A test dashboard",
            layout=[{'i': str(viz.id), 'x': 0, 'y': 0, 'w': 6, 'h': 10}],
            is_public=False,
            visualizations=[viz]
        )
        session.add(dash)
        session.commit()
        return dash
    return _create_dash

```