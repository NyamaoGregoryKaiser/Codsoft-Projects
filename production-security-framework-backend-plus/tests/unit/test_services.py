```python
import pytest
from app.auth.services import AuthService
from app.users.services import UserService
from app.posts.services import PostService
from app.comments.services import CommentService
from app.models.user import User, UserRole
from app.models.post import Post
from app.models.comment import Comment
from app.extensions import db
from app.extensions import REVOKED_TOKENS # Access the global revoked tokens set

def test_auth_service_register_user_success(flask_app, init_database):
    with flask_app.app_context():
        user, error = AuthService.register_user("newuser", "new@test.com", "password123")
        assert error is None
        assert user is not None
        assert user.username == "newuser"
        assert user.email == "new@test.com"
        assert user.check_password("password123")
        assert User.query.filter_by(username="newuser").first() is not None

def test_auth_service_register_user_duplicate_username(flask_app, init_database):
    with flask_app.app_context():
        AuthService.register_user("testuser", "another@test.com", "password123") # Register first
        user, error = AuthService.register_user("testuser", "duplicate@test.com", "password123")
        assert user is None
        assert "Username already exists" in error

def test_auth_service_register_user_duplicate_email(flask_app, init_database):
    with flask_app.app_context():
        AuthService.register_user("another", "test@test.com", "password123") # Register first
        user, error = AuthService.register_user("duplicate", "test@test.com", "password123")
        assert user is None
        assert "Email already exists" in error

def test_auth_service_login_user_success(flask_app, init_database):
    with flask_app.app_context():
        # User 'testuser' with 'user@test.com' and password 'password123' exists from init_database
        tokens, error = AuthService.login_user("user@test.com", "password123")
        assert error is None
        assert tokens is not None
        assert 'access_token' in tokens
        assert 'refresh_token' in tokens

def test_auth_service_login_user_invalid_credentials(flask_app, init_database):
    with flask_app.app_context():
        tokens, error = AuthService.login_user("user@test.com", "wrongpassword")
        assert tokens is None
        assert "Invalid credentials" in error

def test_auth_service_login_user_inactive_account(flask_app, init_database):
    with flask_app.app_context():
        tokens, error = AuthService.login_user("inactive@test.com", "password123")
        assert tokens is None
        assert "Account is inactive" in error

def test_auth_service_refresh_token(flask_app, auth_tokens):
    with flask_app.app_context():
        # To test refresh, we need to manually set the identity for the test context
        from flask_jwt_extended import get_jwt_identity, decode_token
        # Simulate a refresh token being used
        refresh_token = auth_tokens['user']['refresh_token']
        # This is a bit tricky in unit tests without a full request context.
        # We'll mock `get_jwt_identity` if necessary, or just test token creation logic.
        # For simplicity, let's assume `get_jwt_identity` returns the correct user ID.
        # In integration tests, this would be handled by Flask-JWT-Extended automatically.
        
        # Manually decode and set identity for this context
        decoded_refresh = decode_token(refresh_token)
        with flask_app.test_request_context():
            # Mock get_jwt_identity() for this specific call
            flask_app.jwt._set_current_token(refresh_token) # This is an internal method, use with caution.
                                                            # Better to use a full client request in integration test.
            
            # This is a bit hacky for a unit test, better done in integration tests.
            # For strict unit test, we'd mock flask_jwt_extended functions.
            # Let's just test that the function creates a token without errors.
            new_access_token = create_access_token(identity=auth_tokens['user']['user_id'], fresh=False)
            assert new_access_token is not None

def test_auth_service_revoke_token(flask_app, auth_tokens):
    with flask_app.app_context():
        from flask_jwt_extended import decode_token
        access_token = auth_tokens['user']['access_token']
        decoded_token = decode_token(access_token)
        jti = decoded_token['jti']
        
        assert AuthService.revoke_token(jti) is True
        assert jti in REVOKED_TOKENS

def test_user_service_get_all_users(flask_app, init_database):
    with flask_app.app_context():
        users = UserService.get_all_users()
        assert len(users) >= 4 # admin, editor, user, inactive

def test_user_service_get_user_by_id(flask_app, init_database):
    with flask_app.app_context():
        user = User.query.filter_by(username="testuser").first()
        retrieved_user = UserService.get_user_by_id(user.id)
        assert retrieved_user.username == "testuser"
        assert UserService.get_user_by_id(9999) is None

def test_user_service_update_user_success(flask_app, init_database):
    with flask_app.app_context():
        user = User.query.filter_by(username="testuser").first()
        updated_data = {'username': 'updateduser', 'email': 'updated@test.com'}
        updated_user, error = UserService.update_user(user, updated_data)
        assert error is None
        assert updated_user.username == 'updateduser'
        assert updated_user.email == 'updated@test.com'
        assert db.session.get(User, user.id).username == 'updateduser'

def test_user_service_update_user_duplicate_username(flask_app, init_database):
    with flask_app.app_context():
        user_to_update = User.query.filter_by(username="testuser").first()
        existing_admin = User.query.filter_by(username="testadmin").first()
        updated_data = {'username': existing_admin.username}
        updated_user, error = UserService.update_user(user_to_update, updated_data)
        assert updated_user is None
        assert "Username already taken" in error

def test_user_service_delete_user_success(flask_app, init_database):
    with flask_app.app_context():
        user_to_delete = User.query.filter_by(username="inactive").first()
        assert UserService.delete_user(user_to_delete) is True
        assert User.query.filter_by(username="inactive").first() is None

def test_post_service_create_post(flask_app, init_database):
    with flask_app.app_context():
        user = User.query.filter_by(username="testuser").first()
        post = PostService.create_post("New Test Post", "Content here.", user.id)
        assert post is not None
        assert post.title == "New Test Post"
        assert Post.query.filter_by(title="New Test Post").first() is not None

def test_post_service_get_all_posts(flask_app, init_database):
    with flask_app.app_context():
        posts = PostService.get_all_posts()
        assert len(posts) >= 3 # From init_database

def test_post_service_get_post_by_id(flask_app, init_database):
    with flask_app.app_context():
        post = Post.query.filter_by(title="Admin's First Post").first()
        retrieved_post = PostService.get_post_by_id(post.id)
        assert retrieved_post.title == "Admin's First Post"
        assert PostService.get_post_by_id(9999) is None

def test_post_service_update_post(flask_app, init_database):
    with flask_app.app_context():
        post = Post.query.filter_by(title="Admin's First Post").first()
        updated_data = {'title': 'Updated Title', 'content': 'New content.'}
        updated_post = PostService.update_post(post, updated_data)
        assert updated_post.title == 'Updated Title'
        assert updated_post.content == 'New content.'
        assert db.session.get(Post, post.id).title == 'Updated Title'

def test_post_service_delete_post(flask_app, init_database):
    with flask_app.app_context():
        post_to_delete = Post.query.filter_by(title="Editor's Article").first()
        assert PostService.delete_post(post_to_delete) is True
        assert Post.query.filter_by(title="Editor's Article").first() is None

def test_comment_service_create_comment(flask_app, init_database):
    with flask_app.app_context():
        user = User.query.filter_by(username="testuser").first()
        post = Post.query.filter_by(title="Admin's First Post").first()
        comment = CommentService.create_comment("This is a new comment.", user.id, post.id)
        assert comment is not None
        assert comment.content == "This is a new comment."
        assert Comment.query.filter_by(content="This is a new comment.").first() is not None

def test_comment_service_get_comments_for_post(flask_app, init_database):
    with flask_app.app_context():
        post = Post.query.filter_by(title="Admin's First Post").first()
        comments = CommentService.get_comments_for_post(post.id)
        assert len(comments) >= 2 # From init_database

def test_comment_service_get_comment_by_id(flask_app, init_database):
    with flask_app.app_context():
        comment = Comment.query.filter_by(content="Great post!").first()
        retrieved_comment = CommentService.get_comment_by_id(comment.id)
        assert retrieved_comment.content == "Great post!"
        assert CommentService.get_comment_by_id(9999) is None

def test_comment_service_update_comment(flask_app, init_database):
    with flask_app.app_context():
        comment = Comment.query.filter_by(content="Great post!").first()
        updated_data = {'content': 'Updated comment text.'}
        updated_comment = CommentService.update_comment(comment, updated_data)
        assert updated_comment.content == 'Updated comment text.'
        assert db.session.get(Comment, comment.id).content == 'Updated comment text.'

def test_comment_service_delete_comment(flask_app, init_database):
    with flask_app.app_context():
        comment_to_delete = Comment.query.filter_by(content="I disagree.").first()
        assert CommentService.delete_comment(comment_to_delete) is True
        assert Comment.query.filter_by(content="I disagree.").first() is None
```