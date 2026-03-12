import pytest
from backend.app.models.user import User
from backend.app.models.token_blacklist import TokenBlacklist
from backend.app.extensions import db

def test_register_user_success(client, session):
    response = client.post(
        '/api/auth/register',
        json={'username': 'newuser', 'email': 'newuser@example.com', 'password': 'Password123!'}
    )
    assert response.status_code == 201
    assert 'id' in response.json
    assert response.json['username'] == 'newuser'
    assert response.json['email'] == 'newuser@example.com'

    user = session.scalar(db.select(User).filter_by(username='newuser'))
    assert user is not None
    assert user.check_password('Password123!')

def test_register_user_duplicate_username_email(client, session):
    # Register first user
    client.post(
        '/api/auth/register',
        json={'username': 'duplicate', 'email': 'duplicate@example.com', 'password': 'Password123!'}
    )

    # Attempt to register with duplicate username
    response = client.post(
        '/api/auth/register',
        json={'username': 'duplicate', 'email': 'another@example.com', 'password': 'Password123!'}
    )
    assert response.status_code == 409
    assert 'Username already exists' in response.json['message']

    # Attempt to register with duplicate email
    response = client.post(
        '/api/auth/register',
        json={'username': 'another', 'email': 'duplicate@example.com', 'password': 'Password123!'}
    )
    assert response.status_code == 409
    assert 'Email already registered' in response.json['message']

def test_login_user_success(client, session):
    response = client.post(
        '/api/auth/login',
        json={'email': 'test@example.com', 'password': 'TestPassword123!'}
    )
    assert response.status_code == 200
    assert 'access_token' in response.json
    assert 'refresh_token' in response.json
    assert 'user' in response.json
    assert response.json['user']['email'] == 'test@example.com'

def test_login_user_invalid_credentials(client, session):
    response = client.post(
        '/api/auth/login',
        json={'email': 'test@example.com', 'password': 'WrongPassword'}
    )
    assert response.status_code == 401
    assert 'Invalid credentials' in response.json['message']

    response = client.post(
        '/api/auth/login',
        json={'email': 'nonexistent@example.com', 'password': 'Password123!'}
    )
    assert response.status_code == 401
    assert 'Invalid credentials' in response.json['message']

def test_logout_user_success(client, session, auth_headers):
    response = client.post('/api/auth/logout', headers=auth_headers)
    assert response.status_code == 200
    assert 'Successfully logged out' in response.json['message']

    # Check if tokens are blacklisted
    access_token = auth_headers['Authorization'].split(' ')[1]
    refresh_token = auth_headers['X-Refresh-Token']
    
    from flask_jwt_extended import decode_token
    decoded_access = decode_token(access_token)
    decoded_refresh = decode_token(refresh_token)

    access_jti = decoded_access['jti']
    refresh_jti = decoded_refresh['jti']

    assert session.scalar(db.select(TokenBlacklist).filter_by(jti=access_jti)) is not None
    assert session.scalar(db.select(TokenBlacklist).filter_by(jti=refresh_jti)) is not None

def test_logout_user_no_tokens(client):
    response = client.post('/api/auth/logout')
    assert response.status_code == 400
    assert 'Access token and Refresh token are required for logout' in response.json['message']

def test_refresh_token_success(client, session, auth_headers):
    # Log in to get fresh tokens
    login_response = client.post(
        '/api/auth/login',
        json={'email': 'test@example.com', 'password': 'TestPassword123!'}
    )
    refresh_token = login_response.json['refresh_token']

    response = client.post(
        '/api/auth/refresh',
        headers={'Authorization': f'Bearer {refresh_token}'}
    )
    assert response.status_code == 200
    assert 'access_token' in response.json

def test_refresh_token_revoked(client, session, auth_headers):
    # Log out to revoke tokens
    client.post('/api/auth/logout', headers=auth_headers)

    # Try to refresh with a revoked refresh token
    refresh_token = auth_headers['X-Refresh-Token']
    response = client.post(
        '/api/auth/refresh',
        headers={'Authorization': f'Bearer {refresh_token}'}
    )
    assert response.status_code == 401
    assert 'Token has been revoked' in response.json['msg']

def test_protected_endpoint_requires_auth(client):
    response = client.get('/api/users/me')
    assert response.status_code == 401
    assert 'Request does not contain an access token' in response.json['msg']

def test_protected_endpoint_with_auth(client, auth_headers):
    response = client.get('/api/users/me', headers=auth_headers)
    assert response.status_code == 200
    assert response.json['username'] == 'testuser'

def test_admin_protected_endpoint_non_admin_access(client, auth_headers):
    response = client.get('/api/users/', headers=auth_headers)
    assert response.status_code == 403
    assert 'Access Forbidden: Insufficient permissions' in response.json['message']

def test_admin_protected_endpoint_admin_access(client, admin_auth_headers):
    response = client.get('/api/users/', headers=admin_auth_headers)
    assert response.status_code == 200
    assert len(response.json) >= 2 # Should contain admin and testuser at least
    assert any(user['username'] == 'admin' for user in response.json)
    assert any(user['username'] == 'testuser' for user in response.json)

def test_forgot_password_request_success(client, mocker, session, app):
    mocker.patch('backend.app.services.mail_service.send_email', return_value=True)
    
    # Need to set FRONTEND_URL for the link generation
    app.config['FRONTEND_URL'] = 'http://localhost:3000'

    response = client.post(
        '/api/auth/password/forgot',
        json={'email': 'test@example.com'}
    )
    assert response.status_code == 200
    assert 'If an account with that email exists, a password reset link has been sent.' in response.json['message']
    
    # Assert email was attempted to be sent
    from backend.app.services.mail_service import send_email
    send_email.assert_called_once()
    assert 'test@example.com' in send_email.call_args[0][0]
    assert 'Password Reset' in send_email.call_args[0][1]
    assert 'http://localhost:3000/reset-password/' in send_email.call_args[0][2]

def test_reset_password_success(client, session, app):
    app.config['SECRET_KEY'] = 'test-secret-key' # Ensure app uses the same secret for token generation/verification

    user = session.scalar(db.select(User).filter_by(email='test@example.com'))
    token = user.generate_reset_token(expires_in=3600) # Generate a valid token

    response = client.post(
        '/api/auth/password/reset',
        json={'token': token, 'new_password': 'NewSecurePassword123!'}
    )
    assert response.status_code == 200
    assert 'Password reset successfully.' in response.json['message']

    # Verify password was changed
    updated_user = session.scalar(db.select(User).filter_by(email='test@example.com'))
    assert updated_user.check_password('NewSecurePassword123!')

def test_reset_password_invalid_token(client, session):
    response = client.post(
        '/api/auth/password/reset',
        json={'token': 'invalid.token.string', 'new_password': 'NewSecurePassword123!'}
    )
    assert response.status_code == 400
    assert 'Invalid or expired password reset token' in response.json['message']
```