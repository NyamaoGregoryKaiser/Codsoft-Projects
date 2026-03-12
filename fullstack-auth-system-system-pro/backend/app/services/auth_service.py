from flask_jwt_extended import create_access_token, create_refresh_token, decode_token
from backend.app.extensions import db, jwt
from backend.app.models.user import User, UserSchema
from backend.app.models.token_blacklist import TokenBlacklist
from backend.app.utils.errors import APIError
from marshmallow import Schema, fields, validate
from flask import current_app

user_schema = UserSchema()

class LoginSchema(Schema):
    email = fields.Email(required=True)
    password = fields.Str(required=True)

class RefreshSchema(Schema):
    refresh_token = fields.Str(required=True)

class AuthService:

    @staticmethod
    def login_user(data):
        """Authenticates a user and issues JWT tokens."""
        errors = LoginSchema().validate(data)
        if errors:
            raise APIError("Validation Error", status_code=422, payload=errors)

        email = data['email']
        password = data['password']

        user = db.session.scalar(db.select(User).filter_by(email=email))
        if user and user.check_password(password):
            if not user.active:
                raise APIError("Account is inactive. Please contact support.", status_code=403)
            
            # We use user.id as identity in JWT
            access_token = create_access_token(identity=user.id, fresh=True)
            refresh_token = create_refresh_token(identity=user.id)

            current_app.logger.info(f"User {user.username} logged in successfully.")
            return {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "user": user_schema.dump(user)
            }
        raise APIError("Invalid credentials", status_code=401)

    @staticmethod
    def logout_user(access_token, refresh_token):
        """Blacklists the access and refresh tokens."""
        try:
            decoded_access = decode_token(access_token)
            decoded_refresh = decode_token(refresh_token)

            access_jti = decoded_access["jti"]
            access_exp = decoded_access["exp"]
            refresh_jti = decoded_refresh["jti"]
            refresh_exp = decoded_refresh["exp"]
            user_id = decoded_access["sub"] # User ID stored in 'sub' field

            # Blacklist access token
            access_blacklist = TokenBlacklist(
                jti=access_jti,
                token_type='access',
                user_id=user_id,
                expires_at=datetime.fromtimestamp(access_exp)
            )
            db.session.add(access_blacklist)

            # Blacklist refresh token
            refresh_blacklist = TokenBlacklist(
                jti=refresh_jti,
                token_type='refresh',
                user_id=user_id,
                expires_at=datetime.fromtimestamp(refresh_exp)
            )
            db.session.add(refresh_blacklist)
            db.session.commit()
            
            current_app.logger.info(f"User {user_id} logged out, tokens blacklisted.")
            return {"message": "Successfully logged out"}
        except Exception as e:
            current_app.logger.error(f"Error during logout: {e}")
            raise APIError("Error during logout", status_code=500, payload={"details": str(e)})

    @staticmethod
    def refresh_access_token(current_user_id, refresh_jti, refresh_exp):
        """Creates a new access token from a valid refresh token."""
        # Ensure the refresh token is not blacklisted
        token_blacklisted = db.session.scalar(db.select(TokenBlacklist).filter_by(jti=refresh_jti))
        if token_blacklisted:
            raise APIError("Refresh token has been revoked", status_code=401)
        
        # Optionally, check user status
        user = db.session.scalar(db.select(User).filter_by(id=current_user_id))
        if not user or not user.active:
            raise APIError("User not found or inactive", status_code=401)

        new_access_token = create_access_token(identity=current_user_id, fresh=False)
        current_app.logger.info(f"User {current_user_id} refreshed access token.")
        return {"access_token": new_access_token}
```