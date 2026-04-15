```python
from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt, create_access_token, get_jwt_identity
from flask_restx import Resource, Namespace
from marshmallow import ValidationError
from app.schemas.user import UserRegistrationSchema, UserLoginSchema, UserSchema
from app.auth.services import AuthService
from app.extensions import limiter, api, cache
from app.errors import APIError

auth_ns = Namespace('auth', description='Authentication operations')

# Schemas for request parsing and response marshalling
user_registration_schema = UserRegistrationSchema()
user_login_schema = UserLoginSchema()
user_schema = UserSchema()

# Flask-RESTX model definitions for Swagger documentation
user_reg_model = auth_ns.model('UserRegistration', {
    'username': fields.String(required=True, description='User\'s chosen username'),
    'email': fields.String(required=True, description='User\'s email address'),
    'password': fields.String(required=True, description='User\'s password', min_length=8)
})

user_login_model = auth_ns.model('UserLogin', {
    'email': fields.String(required=True, description='User\'s email address'),
    'password': fields.String(required=True, description='User\'s password')
})

auth_success_model = auth_ns.model('AuthSuccess', {
    'access_token': fields.String(description='JWT Access Token'),
    'refresh_token': fields.String(description='JWT Refresh Token')
})

refresh_success_model = auth_ns.model('RefreshSuccess', {
    'access_token': fields.String(description='New JWT Access Token')
})

@auth_ns.route('/register')
class UserRegister(Resource):
    @auth_ns.expect(user_reg_model, validate=True)
    @auth_ns.response(201, 'User registered successfully', user_schema)
    @auth_ns.response(400, 'Validation Error')
    @auth_ns.response(409, 'User already exists')
    @limiter.limit("5 per minute", error_message="Too many registration attempts. Please try again later.")
    def post(self):
        """Register a new user account."""
        try:
            user_data = user_registration_schema.load(request.json)
        except ValidationError as err:
            raise APIError(message="Validation failed", code=400, payload={'errors': err.messages})

        user, error = AuthService.register_user(
            user_data['username'],
            user_data['email'],
            request.json['password'] # Password is load_only, access from raw request.json
        )
        if error:
            status_code = 409 if "exists" in error else 400
            raise APIError(message=error, code=status_code)
        
        return user_schema.dump(user), 201

@auth_ns.route('/login')
class UserLogin(Resource):
    @auth_ns.expect(user_login_model, validate=True)
    @auth_ns.response(200, 'Logged in successfully', auth_success_model)
    @auth_ns.response(400, 'Validation Error')
    @auth_ns.response(401, 'Invalid credentials or inactive account')
    @limiter.limit("10 per minute", error_message="Too many login attempts. Please try again later.")
    def post(self):
        """Authenticate user and return access/refresh tokens."""
        try:
            credentials = user_login_schema.load(request.json)
        except ValidationError as err:
            raise APIError(message="Validation failed", code=400, payload={'errors': err.messages})

        tokens, error = AuthService.login_user(credentials['email'], credentials['password'])
        if error:
            raise APIError(message=error, code=401)
        
        # Invalidate cache for the user if any user-specific cache was based on unauthenticated state
        cache.delete(f"user_{get_jwt_identity()}") # If we cached `get_jwt_identity()` before it existed
        
        return tokens, 200

@auth_ns.route('/refresh')
class TokenRefresh(Resource):
    @jwt_required(refresh=True)
    @auth_ns.response(200, 'Token refreshed successfully', refresh_success_model)
    @auth_ns.response(401, 'Refresh token required')
    @limiter.limit("10 per day", error_message="Too many token refresh attempts.")
    def post(self):
        """Refresh an expired access token using a refresh token."""
        new_access_token = AuthService.refresh_access_token()
        return {'access_token': new_access_token}, 200

@auth_ns.route('/logout')
class UserLogout(Resource):
    @jwt_required()
    @auth_ns.response(200, 'Logged out successfully')
    @auth_ns.response(401, 'Unauthorized')
    @limiter.limit("10 per minute")
    def post(self):
        """Revoke the current access token."""
        jti = get_jwt()['jti']
        AuthService.revoke_token(jti)
        current_user_id = get_jwt_identity()
        cache.delete(f"user_{current_user_id}") # Clear any cached data for the user
        return {"message": "Successfully logged out"}, 200

@auth_ns.route('/whoami')
class WhoAmI(Resource):
    @jwt_required()
    @auth_ns.response(200, 'Current user info', user_schema)
    @auth_ns.response(401, 'Unauthorized')
    @cache.cached(timeout=60, key_prefix="whoami_") # Cache per user based on JWT identity
    def get(self):
        """Get current authenticated user's information."""
        from app.models.user import User # Import here to avoid circular dependency with schemas
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user:
            raise APIError(message="User not found", code=404)
        return user_schema.dump(user), 200
```