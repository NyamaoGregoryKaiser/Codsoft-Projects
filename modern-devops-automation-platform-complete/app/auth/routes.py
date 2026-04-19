from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity, current_user as jwt_current_user, unset_jwt_cookies, set_access_cookies, set_refresh_cookies
from app.models import db, User
from app.errors import BadRequestError, UnauthorizedError, ConflictError
from app.utils.decorators import jwt_required_custom
from app import cache, jwt, limiter

auth_bp = Blueprint('auth', __name__)

# JTI (JWT ID) for token blacklisting (for logout/revocation)
@jwt.token_in_blocklist_loader
def check_if_token_is_revoked(jwt_header, jwt_payload):
    jti = jwt_payload["jti"]
    # This example uses Redis to store revoked tokens.
    # In a real application, you might use a more persistent store.
    entry = cache.get(jti)
    return entry is not None

@auth_bp.route('/register', methods=['POST'])
@limiter.limit("5 per hour", error_message="Too many registration attempts. Please try again later.")
def register_user():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not all([username, email, password]):
        raise BadRequestError("Missing username, email, or password.")

    if User.query.filter_by(username=username).first():
        raise ConflictError(f"User with username '{username}' already exists.")
    if User.query.filter_by(email=email).first():
        raise ConflictError(f"User with email '{email}' already exists.")

    new_user = User(username=username, email=email, password=password)
    db.session.add(new_user)
    db.session.commit()
    current_app.logger.info(f"User registered: {username}")
    return jsonify({"message": "User registered successfully", "user_id": new_user.id}), 201

@auth_bp.route('/login', methods=['POST'])
@limiter.limit("10 per minute", error_message="Too many login attempts. Please wait and try again.")
def login_user():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not all([username, password]):
        raise BadRequestError("Missing username or password.")

    user = User.query.filter_by(username=username).first()
    if user and user.check_password(password):
        if not user.is_active:
            raise ForbiddenError("Account is inactive.")
        access_token = create_access_token(identity=user.id, additional_claims={"is_admin": user.is_admin})
        refresh_token = create_refresh_token(identity=user.id)
        current_app.logger.info(f"User logged in: {username}")
        response = jsonify({
            "message": "Login successful",
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": user.to_dict()
        })
        # Set cookies (optional, for browser-based apps)
        # set_access_cookies(response, access_token)
        # set_refresh_cookies(response, refresh_token)
        return response, 200
    else:
        raise UnauthorizedError("Invalid username or password.")

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh_token():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    if not user:
        raise UnauthorizedError("User not found for refreshing token.")
    if not user.is_active:
        raise ForbiddenError("Account is inactive.")

    new_access_token = create_access_token(identity=current_user_id, additional_claims={"is_admin": user.is_admin})
    current_app.logger.info(f"Token refreshed for user ID: {current_user_id}")
    response = jsonify({"access_token": new_access_token})
    # set_access_cookies(response, new_access_token)
    return response, 200

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout_user():
    jti = jwt_current_user.jti
    # Cache the JTI for the duration of the token's remaining validity
    # This prevents the token from being used again.
    # Note: Flask-JWT-Extended 4.x uses get_jwt() for this.
    jwt_data = get_jwt()
    expires_in = jwt_data["exp"] - jwt_data["iat"] # time from issued to expiration
    cache.set(jti, "true", timeout=expires_in)
    current_app.logger.info(f"User logged out, token JTI revoked: {jti}")
    response = jsonify({"message": "Successfully logged out"})
    # unset_jwt_cookies(response) # Optional, if using cookies
    return response, 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required_custom # Use custom decorator to load user object
def get_current_user():
    current_user = request.current_user
    return jsonify(current_user.to_dict()), 200
```