```python
import pytest
import json
from app.extensions import REVOKED_TOKENS
from app.models.user import User

def test_register_user_success(client, init_database):
    response = client.post('/api/auth/register', json={
        'username': 'newuserapi',
        'email': 'newuserapi@test.com',
        'password': 'password123'
    })
    assert response.status_code == 201
    data = json.loads(response.data)
    assert 'id' in data
    assert data['username'] == 'newuserapi'
    assert data['email'] == 'newuserapi@test.com' # Email is dumped for the registering user

def test_register_user_missing_fields(client, init_database):
    response = client.post('/api/auth/register', json={
        'username': 'incomplete'
        # missing email and password
    })
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'errors' in data
    assert 'email' in data['errors']
    assert 'password' in data['errors']

def test_register_user_duplicate_username(client, init_database):
    client.post('/api/auth/register', json={
        'username': 'duplicatename', 'email': 'first@test.com', 'password': 'password123'
    })
    response = client.post('/api/auth/register', json={
        'username': 'duplicatename', 'email': 'second@test.com', 'password': 'password123'
    })
    assert response.status_code == 409
    data = json.loads(response.data)
    assert 'Username already exists' in data['message']

def test_register_user_duplicate_email(client, init_database):
    client.post('/api/auth/register', json={
        'username': 'firstuser', 'email': 'duplicate@test.com', 'password': 'password123'
    })
    response = client.post('/api/auth/register', json={
        'username': 'seconduser', 'email': 'duplicate@test.com', 'password': 'password123'
    })
    assert response.status_code == 409
    data = json.loads(response.data)
    assert 'Email already exists' in data['message']

def test_login_user_success(client, init_database):
    response = client.post('/api/auth/login', json={
        'email': 'user@test.com',
        'password': 'password123'
    })
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'access_token' in data
    assert 'refresh_token' in data

def test_login_user_invalid_credentials(client, init_database):
    response = client.post('/api/auth/login', json={
        'email': 'user@test.com',
        'password': 'wrongpassword'
    })
    assert response.status_code == 401
    data = json.loads(response.data)
    assert 'Invalid credentials' in data['message']

def test_login_user_inactive_account(client, init_database):
    response = client.post('/api/auth/login', json={
        'email': 'inactive@test.com',
        'password': 'password123'
    })
    assert response.status_code == 401
    data = json.loads(response.data)
    assert 'Account is inactive' in data['message']

def test_refresh_token_success(client, init_database):
    login_response = client.post('/api/auth/login', json={
        'email': 'user@test.com',
        'password': 'password123'
    })
    refresh_token = json.loads(login_response.data)['refresh_token']

    refresh_response = client.post('/api/auth/refresh', headers={
        'Authorization': f'Bearer {refresh_token}'
    })
    assert refresh_response.status_code == 200
    data = json.loads(refresh_response.data)
    assert 'access_token' in data

def test_refresh_token_invalid_refresh_token(client, init_database):
    refresh_response = client.post('/api/auth/refresh', headers={
        'Authorization': 'Bearer invalidtoken'
    })
    assert refresh_response.status_code == 401
    data = json.loads(refresh_response.data)
    assert 'Signature verification failed' in data['message']

def test_logout_user_success(client, init_database, auth_tokens):
    REVOKED_TOKENS.clear() # Ensure clean state
    access_token = auth_tokens['user']['access_token']
    
    response = client.post('/api/auth/logout', headers={
        'Authorization': f'Bearer {access_token}'
    })
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'Successfully logged out' in data['message']

    # Verify the token is now in the blocklist
    from flask_jwt_extended import decode_token
    jti = decode_token(access_token)['jti']
    assert jti in REVOKED_TOKENS

    # Try to use the revoked token
    response_after_logout = client.get('/api/auth/whoami', headers={
        'Authorization': f'Bearer {access_token}'
    })
    assert response_after_logout.status_code == 401
    data_after_logout = json.loads(response_after_logout.data)
    assert 'Token has been revoked' in data_after_logout['message']

def test_logout_user_no_token(client, init_database):
    response = client.post('/api/auth/logout')
    assert response.status_code == 401 # Should return unauthorized because no token was sent
    data = json.loads(response.data)
    assert 'Missing or invalid token' in data['message']

def test_whoami_success(client, init_database, auth_tokens):
    access_token = auth_tokens['user']['access_token']
    response = client.get('/api/auth/whoami', headers={
        'Authorization': f'Bearer {access_token}'
    })
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['username'] == 'testuser'
    assert data['email'] == 'user@test.com' # For current user, email is included in dump

def test_whoami_unauthorized(client, init_database):
    response = client.get('/api/auth/whoami')
    assert response.status_code == 401
    data = json.loads(response.data)
    assert 'Missing or invalid token' in data['message']

def test_whoami_with_invalid_token(client, init_database):
    response = client.get('/api/auth/whoami', headers={
        'Authorization': 'Bearer invalidtoken'
    })
    assert response.status_code == 401
    data = json.loads(response.data)
    assert 'Signature verification failed' in data['message']
```