from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, \
    get_jwt, fresh_jwt_required, create_access_token
from webargs.flaskparser import use_args
from backend.app.services.auth_service import AuthService, LoginSchema
from backend.app.services.user_service import UserService, UserRegisterSchema
from backend.app.extensions import limiter
from backend.app.utils.errors import APIError

bp = Blueprint('auth', __name__)

@bp.route('/register', methods=['POST'])
@limiter.limit("10 per hour", override_defaults=False)
@use_args(UserRegisterSchema(), location="json")
def register(args):
    """
    User Registration
    ---
    post:
      summary: Register a new user
      parameters:
        - in: body
          name: body
          schema:
            type: object
            required:
              - username
              - email
              - password
            properties:
              username:
                type: string
                example: johndoe
              email:
                type: string
                format: email
                example: john.doe@example.com
              password:
                type: string
                format: password
                example: StrongPassword123!
      responses:
        201:
          description: User registered successfully
          schema:
            type: object
            properties:
              id: {type: integer}
              username: {type: string}
              email: {type: string}
        409:
          description: Conflict, e.g., username/email already exists
        422:
          description: Validation error
    """
    user_data = args
    new_user = UserService.create_user(user_data)
    return jsonify(new_user), 201

@bp.route('/login', methods=['POST'])
@limiter.limit("5 per minute", override_defaults=False) # More restrictive for login
@use_args(LoginSchema(), location="json")
def login(args):
    """
    User Login
    ---
    post:
      summary: Authenticate user and get JWT tokens
      parameters:
        - in: body
          name: body
          schema:
            type: object
            required:
              - email
              - password
            properties:
              email:
                type: string
                format: email
                example: admin@example.com
              password:
                type: string
                format: password
                example: AdminPassword123!
      responses:
        200:
          description: User logged in successfully
          schema:
            type: object
            properties:
              access_token: {type: string}
              refresh_token: {type: string}
              user:
                $ref: '#/definitions/UserSchema' # Reference to UserSchema definition
        401:
          description: Invalid credentials
        422:
          description: Validation error
    """
    auth_data = args
    tokens_and_user = AuthService.login_user(auth_data)
    return jsonify(tokens_and_user), 200

@bp.route('/logout', methods=['POST'])
@jwt_required(optional=True) # Allow logout even if token is expired/invalid to blacklist it
@limiter.limit("5 per minute", override_defaults=False)
def logout():
    """
    User Logout
    ---
    post:
      summary: Log out user by blacklisting access and refresh tokens
      security:
        - BearerAuth: []
      parameters:
        - in: header
          name: Authorization
          type: string
          required: true
          description: Access token (Bearer token)
        - in: header
          name: X-Refresh-Token
          type: string
          required: true
          description: Refresh token
      responses:
        200:
          description: Successfully logged out
        401:
          description: Unauthorized (e.g., token missing or invalid)
        500:
          description: Server error during logout
    """
    access_token = request.headers.get('Authorization', '').replace('Bearer ', '')
    refresh_token = request.headers.get('X-Refresh-Token', '')

    if not access_token or not refresh_token:
        raise APIError("Access token and Refresh token are required for logout", status_code=400)
    
    result = AuthService.logout_user(access_token, refresh_token)
    return jsonify(result), 200

@bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True) # Requires a valid refresh token
@limiter.limit("10 per hour", override_defaults=False)
def refresh():
    """
    Refresh Access Token
    ---
    post:
      summary: Obtain a new access token using a refresh token
      security:
        - BearerAuth: []
      parameters:
        - in: header
          name: Authorization
          type: string
          required: true
          description: Refresh token (Bearer token)
      responses:
        200:
          description: New access token generated
          schema:
            type: object
            properties:
              access_token: {type: string}
        401:
          description: Invalid or expired refresh token
    """
    current_user_id = get_jwt_identity()
    refresh_jti = get_jwt()["jti"]
    refresh_exp = get_jwt()["exp"] # Expiration timestamp of the refresh token

    new_access_token_data = AuthService.refresh_access_token(current_user_id, refresh_jti, refresh_exp)
    return jsonify(new_access_token_data), 200

@bp.route('/password/forgot', methods=['POST'])
@limiter.limit("3 per hour", override_defaults=False)
@use_args({"email": {"type": "string", "format": "email", "required": True}}, location="json")
def forgot_password(args):
    """
    Forgot Password Request
    ---
    post:
      summary: Request a password reset link for an email address
      parameters:
        - in: body
          name: body
          schema:
            type: object
            required:
              - email
            properties:
              email:
                type: string
                format: email
                example: user@example.com
      responses:
        200:
          description: Password reset link sent if email exists
        422:
          description: Validation error
    """
    email = args['email']
    result = UserService.initiate_password_reset(email)
    return jsonify(result), 200

@bp.route('/password/reset', methods=['POST'])
@limiter.limit("5 per hour", override_defaults=False)
@use_args({"token": {"type": "string", "required": True}, "new_password": {"type": "string", "required": True}}, location="json")
def reset_password(args):
    """
    Reset Password
    ---
    post:
      summary: Reset password using a valid token
      parameters:
        - in: body
          name: body
          schema:
            type: object
            required:
              - token
              - new_password
            properties:
              token:
                type: string
                description: Password reset token received via email
              new_password:
                type: string
                format: password
                example: NewStrongPassword123!
      responses:
        200:
          description: Password successfully reset
        400:
          description: Invalid or expired token
        422:
          description: Validation error
    """
    token = args['token']
    new_password = args['new_password']
    result = UserService.reset_password(token, new_password)
    return jsonify(result), 200

# Endpoint to test fresh token requirement
@bp.route('/protected-fresh', methods=['GET'])
@fresh_jwt_required()
def protected_fresh():
    """
    Protected Fresh Token Endpoint
    ---
    get:
      summary: Access a resource requiring a fresh access token
      security:
        - BearerAuth: []
      responses:
        200:
          description: Fresh token access granted
          schema:
            type: object
            properties:
              message: {type: string}
              user_id: {type: integer}
        401:
          description: Unauthorized (token missing, invalid or not fresh)
    """
    current_user_id = get_jwt_identity()
    return jsonify(message="You accessed this with a FRESH token!", user_id=current_user_id), 200
```