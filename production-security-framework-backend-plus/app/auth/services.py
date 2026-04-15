```python
from flask import current_app
from app.extensions import db, jwt, REVOKED_TOKENS
from app.models.user import User, UserRole
from flask_jwt_extended import create_access_token, create_refresh_token, get_jwt, get_jwt_identity
from datetime import timedelta

class AuthService:
    @staticmethod
    def register_user(username, email, password):
        """Registers a new user."""
        if User.query.filter_by(username=username).first():
            current_app.logger.warning(f"Registration failed: Username '{username}' already exists.")
            return None, "Username already exists"
        if User.query.filter_by(email=email).first():
            current_app.logger.warning(f"Registration failed: Email '{email}' already exists.")
            return None, "Email already exists"

        user = User(username=username, email=email, role=UserRole.USER)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        current_app.logger.info(f"User '{username}' (ID: {user.id}) registered successfully.")
        return user, None

    @staticmethod
    def login_user(email, password):
        """Authenticates a user and generates JWT tokens."""
        user = User.query.filter_by(email=email).first()
        if not user or not user.check_password(password):
            current_app.logger.warning(f"Login failed: Invalid credentials for email '{email}'.")
            return None, "Invalid credentials"
        
        if not user.is_active:
            current_app.logger.warning(f"Login failed: User '{user.username}' (ID: {user.id}) is inactive.")
            return None, "Account is inactive"

        access_token = create_access_token(identity=user.id, fresh=True)
        refresh_token = create_refresh_token(identity=user.id)
        current_app.logger.info(f"User '{user.username}' (ID: {user.id}) logged in successfully.")
        return {'access_token': access_token, 'refresh_token': refresh_token}, None

    @staticmethod
    def refresh_access_token():
        """Refreshes an access token using a valid refresh token."""
        identity = get_jwt_identity()
        new_access_token = create_access_token(identity=identity, fresh=False)
        current_app.logger.info(f"Access token refreshed for user ID: {identity}.")
        return new_access_token

    @staticmethod
    def revoke_token(token_jti):
        """Adds a token's JTI to the blocklist."""
        REVOKED_TOKENS.add(token_jti)
        current_app.logger.info(f"Token JTI '{token_jti}' revoked.")
        return True
```