```python
import pytest
from app.models.user import User, UserRole
from app.models.post import Post
from app.models.comment import Comment
from app.extensions import db
from datetime import datetime, timedelta

def test_user_model_creation(flask_app):
    with flask_app.app_context():
        user = User(username='testuser_model', email='test@model.com', role=UserRole.USER)
        user.set_password('password123')
        db.session.add(user)
        db.session.commit()

        retrieved_user = db.session.get(User, user.id)
        assert retrieved_user is not None
        assert retrieved_user.username == 'testuser_model'
        assert retrieved_user.email == 'test@model.com'
        assert retrieved_user.check_password('password123')
        assert retrieved_user.role == UserRole.USER
        assert retrieved_user.is_active is True
        assert isinstance(retrieved_user.created_at, datetime)
        assert isinstance(retrieved_user.updated_at, datetime)

def test_user_password_hashing():
    user = User(username='hasher', email='hasher@example.com')
    user.set_password('mysecretpassword')
    assert user.password_hash is not None
    assert user.check_password('mysecretpassword')
    assert not user.check_password('wrongpassword')

def test_user_role_enum():
    admin = User(username='admin_enum', email='admin_enum@example.com', role=UserRole.ADMIN)
    editor = User(username='editor_enum', email='editor_enum@example.com', role=UserRole.EDITOR)
    regular = User(username='regular_enum', email='regular_enum@example.com', role=UserRole.USER)

    assert admin.role == UserRole.ADMIN
    assert editor.role == UserRole.EDITOR
    assert regular.role == UserRole.USER

    assert admin.has_role('admin')
    assert not admin.has_role('user')
    assert editor.has_role(UserRole.EDITOR)

def test_user_to_dict(flask_app):
    with flask_app.app_context():
        user = User(username='dictuser', email='dict@example.com', role=UserRole.EDITOR, is_active=True)
        db.session.add(user)
        db.session.commit()

        user_dict = user.to_dict()
        assert 'password_hash' not in user_dict
        assert 'email' not in user_dict
        assert user_dict['username'] == 'dictuser'
        assert user_dict['role'] == 'editor'
        assert user_dict['is_active'] is True

        user_dict_with_email = user.to_dict(include_email=True)
        assert user_dict_with_email['email'] == 'dict@example.com'

def test_post_model_creation(flask_app, init_database):
    with flask_app.app_context():
        author = db.session.get(User, 1) # Get admin user from init_database
        post = Post(title='My First Test Post', content='This is some content.', author=author)
        db.session.add(post)
        db.session.commit()

        retrieved_post = db.session.get(Post, post.id)
        assert retrieved_post is not None
        assert retrieved_post.title == 'My First Test Post'
        assert retrieved_post.content == 'This is some content.'
        assert retrieved_post.author_id == author.id
        assert retrieved_post.author.username == author.username
        assert isinstance(retrieved_post.created_at, datetime)
        assert isinstance(retrieved_post.updated_at, datetime)

def test_post_to_dict(flask_app, init_database):
    with flask_app.app_context():
        author = db.session.get(User, 1) # Get admin user from init_database
        post = Post(title='Dict Post', content='Content for dict post.', author=author)
        db.session.add(post)
        db.session.commit()

        post_dict = post.to_dict(include_author=True)
        assert post_dict['title'] == 'Dict Post'
        assert post_dict['author']['username'] == author.username
        assert 'comments' in post_dict
        assert post_dict['comments'] == []

def test_comment_model_creation(flask_app, init_database):
    with flask_app.app_context():
        author = db.session.get(User, 3) # Get regular user from init_database
        post = db.session.get(Post, 1) # Get admin's post from init_database
        
        comment = Comment(content='A new comment.', author=author, post=post)
        db.session.add(comment)
        db.session.commit()

        retrieved_comment = db.session.get(Comment, comment.id)
        assert retrieved_comment is not None
        assert retrieved_comment.content == 'A new comment.'
        assert retrieved_comment.author_id == author.id
        assert retrieved_comment.post_id == post.id
        assert retrieved_comment.author.username == author.username
        assert retrieved_comment.post.title == post.title
        assert isinstance(retrieved_comment.created_at, datetime)
        assert isinstance(retrieved_comment.updated_at, datetime)

def test_comment_to_dict(flask_app, init_database):
    with flask_app.app_context():
        author = db.session.get(User, 3) # Get regular user from init_database
        post = db.session.get(Post, 1) # Get admin's post from init_database
        comment = Comment(content='Dict Comment', author=author, post=post)
        db.session.add(comment)
        db.session.commit()

        comment_dict = comment.to_dict(include_author=True)
        assert comment_dict['content'] == 'Dict Comment'
        assert comment_dict['author']['username'] == author.username
        assert comment_dict['post_id'] == post.id
```