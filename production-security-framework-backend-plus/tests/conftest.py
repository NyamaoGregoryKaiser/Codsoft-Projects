```python
import pytest
from app import create_app
from app.extensions import db
from app.models.user import User, UserRole
from app.models.post import Post
from app.models.comment import Comment
from flask_jwt_extended import create_access_token, create_refresh_token
import os

@pytest.fixture(scope='session')
def flask_app():
    """Fixture for a Flask app instance in testing configuration."""
    # Ensure environment variables are set for testing
    os.environ['FLASK_ENV'] = 'testing'
    os.environ['DATABASE_URL_TEST'] = os.getenv('DATABASE_URL_TEST', 'postgresql://test_user:test_password@localhost:5432/test_db')
    os.environ['JWT_SECRET_KEY'] = 'test_jwt_secret'
    os.environ['SECRET_KEY'] = 'test_secret_key'
    os.environ['REDIS_URL'] = 'redis://localhost:6379/0' # Even if using SimpleCache for tests, some parts might check this

    app = create_app('testing')
    with app.app_context():
        # Create all tables
        db.create_all()
        yield app
        # Drop all tables after tests are done
        db.drop_all()

@pytest.fixture(scope='function')
def client(flask_app):
    """Fixture for a Flask test client."""
    return flask_app.test_client()

@pytest.fixture(scope='function')
def init_database(flask_app):
    """Fixture to initialize and clear the database for each test function."""
    with flask_app.app_context():
        db.session.remove()
        db.drop_all()
        db.create_all()

        # Seed initial data for tests
        admin_user = User(username="testadmin", email="admin@test.com", role=UserRole.ADMIN, is_active=True)
        admin_user.set_password("password123")
        db.session.add(admin_user)

        editor_user = User(username="testeditor", email="editor@test.com", role=UserRole.EDITOR, is_active=True)
        editor_user.set_password("password123")
        db.session.add(editor_user)

        regular_user = User(username="testuser", email="user@test.com", role=UserRole.USER, is_active=True)
        regular_user.set_password("password123")
        db.session.add(regular_user)

        inactive_user = User(username="inactive", email="inactive@test.com", role=UserRole.USER, is_active=False)
        inactive_user.set_password("password123")
        db.session.add(inactive_user)

        db.session.commit()

        # Add some posts and comments
        post1 = Post(title="Admin's First Post", content="This is content of admin's first post.", author_id=admin_user.id)
        post2 = Post(title="Editor's Article", content="An article by the editor.", author_id=editor_user.id)
        post3 = Post(title="User's Review", content="My review of something.", author_id=regular_user.id)
        db.session.add_all([post1, post2, post3])
        db.session.commit()

        comment1 = Comment(content="Great post!", author_id=regular_user.id, post_id=post1.id)
        comment2 = Comment(content="I disagree.", author_id=editor_user.id, post_id=post1.id)
        db.session.add_all([comment1, comment2])
        db.session.commit()

        yield db # Pass the database session
        db.session.remove()
        db.drop_all() # Clean up after each test

@pytest.fixture(scope='function')
def auth_tokens(flask_app, init_database):
    """Fixture to provide authentication tokens for test users."""
    with flask_app.app_context():
        admin = User.query.filter_by(username="testadmin").first()
        editor = User.query.filter_by(username="testeditor").first()
        user = User.query.filter_by(username="testuser").first()
        inactive = User.query.filter_by(username="inactive").first()

        tokens = {
            'admin': {
                'access_token': create_access_token(identity=admin.id, fresh=True),
                'refresh_token': create_refresh_token(identity=admin.id),
                'user_id': admin.id
            },
            'editor': {
                'access_token': create_access_token(identity=editor.id, fresh=True),
                'refresh_token': create_refresh_token(identity=editor.id),
                'user_id': editor.id
            },
            'user': {
                'access_token': create_access_token(identity=user.id, fresh=True),
                'refresh_token': create_refresh_token(identity=user.id),
                'user_id': user.id
            },
            'inactive': {
                'access_token': create_access_token(identity=inactive.id, fresh=True),
                'refresh_token': create_refresh_token(identity=inactive.id),
                'user_id': inactive.id
            }
        }
        return tokens
```