```python
from flask import Blueprint, request, jsonify, current_app
from flask_restx import Resource, Namespace
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity, current_user, get_jwt
from app import db, bcrypt, jwt, limiter
from app.models.user import User
from app.auth.schemas import user_login_model, user_register_model, token_model, message_model, user_model
from app.utils.decorators import admin_required, jwt_and_user_loader
import logging

auth_bp = Blueprint('auth', __name__)
ns = Namespace('auth', description='Authentication related operations')

# JWT User lookup function
@jwt.user_lookup_loader
def user_lookup_callback(_jwt_header, jwt_data):
    identity = jwt_data["sub"]
    return User.query.filter_by(id=identity).one_or_none()

@ns.route('/register')
class UserRegister(Resource):
    @ns.expect(user_register_model, validate=True)
    @ns.response(201, 'User successfully created', user_model)
    @ns.response(400, 'Invalid input')
    @ns.response(409, 'User with this username or email already exists')
    @limiter.limit("10 per hour", error_message="Too many registration attempts. Please try again later.")
    def post(self):
        """Register a new user."""
        data = request.json
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')

        if User.find_by_username(username):
            return {'message': 'Username already exists'}, 409
        if User.find_by_email(email):
            return {'message': 'Email already exists'}, 409

        new_user = User(username=username, email=email)
        new_user.set_password(password)
        db.session.add(new_user)
        db.session.commit()
        current_app.logger.info(f"User '{username}' registered successfully.")
        return {'message': 'User registered successfully'}, 201

@ns.route('/login')
class UserLogin(Resource):
    @ns.expect(user_login_model, validate=True)
    @ns.response(200, 'Login successful', token_model)
    @ns.response(401, 'Invalid credentials')
    @limiter.limit("5 per 15 minutes", error_message="Too many login attempts. Please wait before trying again.")
    def post(self):
        """Login a user and return JWT tokens."""
        data = request.json
        username = data.get('username')
        password = data.get('password')

        user = User.find_by_username(username)
        if user and user.check_password(password):
            access_token = create_access_token(identity=user.id, fresh=True)
            refresh_token = create_refresh_token(identity=user.id)
            current_app.logger.info(f"User '{username}' logged in successfully.")
            return {'access_token': access_token, 'refresh_token': refresh_token}, 200
        current_app.logger.warning(f"Failed login attempt for username '{username}'.")
        return {'message': 'Invalid credentials'}, 401

@ns.route('/refresh')
class TokenRefresh(Resource):
    @jwt_required(refresh=True) # Requires a refresh token
    @ns.response(200, 'Token refreshed successfully', token_model)
    @ns.response(401, 'Invalid refresh token')
    def post(self):
        """Refresh an access token using a refresh token."""
        current_user_id = get_jwt_identity()
        new_access_token = create_access_token(identity=current_user_id, fresh=False)
        current_app.logger.info(f"Access token refreshed for user ID '{current_user_id}'.")
        return {'access_token': new_access_token}, 200

# Endpoint to test authenticated access and get current user info
@ns.route('/me')
class UserInfo(Resource):
    @jwt_required()
    @jwt_and_user_loader
    @ns.response(200, 'User info retrieved', user_model)
    @ns.response(401, 'Unauthorized')
    def get(self):
        """Get information about the currently authenticated user."""
        # current_user is available due to jwt_and_user_loader decorator
        current_app.logger.debug(f"Retrieving user info for user ID '{current_user.id}'.")
        return {
            'id': current_user.id,
            'username': current_user.username,
            'email': current_user.email,
            'is_admin': current_user.is_admin,
            'created_at': current_user.created_at.isoformat(),
            'updated_at': current_user.updated_at.isoformat()
        }, 200

# An example of an admin-only endpoint
@ns.route('/admin-status')
class AdminStatus(Resource):
    @jwt_required()
    @jwt_and_user_loader
    @admin_required # Custom decorator for admin check
    @ns.response(200, 'Admin status confirmed')
    @ns.response(403, 'Forbidden')
    def get(self):
        """Check if the current user is an administrator."""
        current_app.logger.info(f"Admin status check for user ID '{current_user.id}' (is_admin: {current_user.is_admin}).")
        return {'message': 'You are an admin!'}, 200

api.add_namespace(ns, path='/auth')
```