import pytest
from backend.app.models.user import User, Role, TokenBlacklist
from backend.app.extensions import db, bcrypt
from datetime import datetime, timedelta

def test_new_user_with_valid_password(session, app):
    admin_role = session.scalar(db.select(Role).filter_by(name='Admin'))
    user = User(username='testuser', email='test@example.com', password='password123', role_name='Admin')
    session.add(user)
    session.commit()

    assert user.id is not None
    assert user.username == 'testuser'
    assert user.email == 'test@example.com'
    assert bcrypt.check_password_hash(user.password_hash, 'password123')
    assert user.role.name == 'Admin'
    assert user.created_at is not None
    assert user.updated_at is not None
    assert user.active is True

def test_user_set_password(session):
    admin_role = session.scalar(db.select(Role).filter_by(name='Admin'))
    user = User(username='testuser', email='test@example.com', password='oldpassword', role_name='Admin')
    session.add(user)
    session.commit()

    user.set_password('newpassword')
    session.commit()
    assert bcrypt.check_password_hash(user.password_hash, 'newpassword')
    assert not bcrypt.check_password_hash(user.password_hash, 'oldpassword')

def test_user_check_password(session):
    admin_role = session.scalar(db.select(Role).filter_by(name='Admin'))
    user = User(username='testuser', email='test@example.com', password='password123', role_name='Admin')
    session.add(user)
    session.commit()

    assert user.check_password('password123')
    assert not user.check_password('wrongpassword')

def test_user_generate_and_verify_reset_token(session, app):
    admin_role = session.scalar(db.select(Role).filter_by(name='Admin'))
    user = User(username='testuser', email='test@example.com', password='password123', role_name='Admin')
    session.add(user)
    session.commit()

    token = user.generate_reset_token(expires_in=1) # Token expires in 1 second
    assert token is not None

    verified_user = User.verify_reset_token(token)
    assert verified_user.id == user.id

    # Test expired token
    import time
    time.sleep(1.1)
    expired_user = User.verify_reset_token(token)
    assert expired_user is None

    # Test invalid token
    invalid_user = User.verify_reset_token("invalid.token.string")
    assert invalid_user is None

def test_user_has_role(session):
    admin_role = session.scalar(db.select(Role).filter_by(name='Admin'))
    user_role = session.scalar(db.select(Role).filter_by(name='User'))

    admin = User(username='adminuser', email='admin@example.com', password='password', role_name='Admin')
    regular_user = User(username='regularuser', email='user@example.com', password='password', role_name='User')
    session.add_all([admin, regular_user])
    session.commit()

    assert admin.has_role('Admin')
    assert not admin.has_role('User')
    assert regular_user.has_role('User')
    assert not regular_user.has_role('Admin')

def test_token_blacklist_creation(session):
    blacklist_entry = TokenBlacklist(
        jti='some-jti-uuid',
        token_type='access',
        user_id=1,
        expires_at=datetime.utcnow() + timedelta(minutes=15)
    )
    session.add(blacklist_entry)
    session.commit()

    retrieved = session.scalar(db.select(TokenBlacklist).filter_by(jti='some-jti-uuid'))
    assert retrieved is not None
    assert retrieved.token_type == 'access'
    assert retrieved.user_id == 1
    assert retrieved.revoked_at is not None
```