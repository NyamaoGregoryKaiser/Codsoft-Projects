```python
from flask_restx import fields
from app import api

# Define a common response model for success messages
message_model = api.model('Message', {
    'message': fields.String(description='A success or error message.')
})

user_model = api.model('User', {
    'id': fields.Integer(readOnly=True, description='The unique identifier of a user'),
    'username': fields.String(required=True, description='The user\'s username'),
    'email': fields.String(required=True, description='The user\'s email address'),
    'is_admin': fields.Boolean(description='Whether the user has admin privileges'),
    'created_at': fields.DateTime(readOnly=True, description='Timestamp when the user was created'),
    'updated_at': fields.DateTime(readOnly=True, description='Timestamp when the user was last updated')
})

user_login_model = api.model('UserLogin', {
    'username': fields.String(required=True, description='The user\'s username'),
    'password': fields.String(required=True, description='The user\'s password', min_length=6)
})

user_register_model = api.model('UserRegister', {
    'username': fields.String(required=True, description='The user\'s username'),
    'email': fields.String(required=True, description='The user\'s email address'),
    'password': fields.String(required=True, description='The user\'s password', min_length=6)
})

token_model = api.model('Token', {
    'access_token': fields.String(required=True, description='JWT access token'),
    'refresh_token': fields.String(required=True, description='JWT refresh token')
})

# Optional: Models for refreshing tokens or revoking tokens
refresh_token_model = api.model('RefreshToken', {
    'refresh_token': fields.String(required=True, description='Refresh token to obtain new access token')
})

revoke_token_model = api.model('RevokeToken', {
    'token': fields.String(required=True, description='Token to revoke (access or refresh)')
})
```