from backend.app.extensions import db
from backend.app.models.user import User, UserSchema, UserRegisterSchema, UserUpdateSchema
from backend.app.utils.errors import APIError
from backend.app.services.mail_service import send_email
from flask import url_for, current_app

user_schema = UserSchema()
users_schema = UserSchema(many=True)
user_register_schema = UserRegisterSchema()
user_update_schema = UserUpdateSchema()

class UserService:

    @staticmethod
    def create_user(data):
        """Registers a new user."""
        errors = user_register_schema.validate(data)
        if errors:
            raise APIError("Validation Error", status_code=422, payload=errors)

        username = data['username']
        email = data['email']
        password = data['password']

        if db.session.scalar(db.select(User).filter_by(username=username)):
            raise APIError("Username already exists", status_code=409)
        if db.session.scalar(db.select(User).filter_by(email=email)):
            raise APIError("Email already registered", status_code=409)

        user = User(username=username, email=email, password=password, role_name='User') # Default to 'User' role
        db.session.add(user)
        db.session.commit()
        return user_schema.dump(user)

    @staticmethod
    def get_user_by_id(user_id):
        """Retrieves a user by ID."""
        user = db.session.scalar(db.select(User).filter_by(id=user_id))
        if not user:
            raise APIError("User not found", status_code=404)
        return user_schema.dump(user)

    @staticmethod
    def update_user(user_id, data, current_user_obj):
        """Updates a user's profile or password."""
        user = db.session.scalar(db.select(User).filter_by(id=user_id))
        if not user:
            raise APIError("User not found", status_code=404)

        # Ensure only the user themselves or an admin can update their profile
        if user.id != current_user_obj.id and not current_user_obj.has_role('Admin'):
            raise APIError("Unauthorized to update this user's profile", status_code=403)

        # Partial updates allowed
        errors = user_update_schema.validate(data, partial=True)
        if errors:
            raise APIError("Validation Error", status_code=422, payload=errors)

        # Handle username update
        if 'username' in data and data['username'] != user.username:
            if db.session.scalar(db.select(User).filter_by(username=data['username'])):
                raise APIError("Username already taken", status_code=409)
            user.username = data['username']

        # Handle email update
        if 'email' in data and data['email'] != user.email:
            if db.session.scalar(db.select(User).filter_by(email=data['email'])):
                raise APIError("Email already registered", status_code=409)
            user.email = data['email']

        # Handle password change
        if 'old_password' in data or 'new_password' in data:
            if not user.check_password(data.get('old_password', '')):
                raise APIError("Incorrect old password", status_code=401)
            if 'new_password' not in data:
                raise APIError("New password is required to change password", status_code=422)
            user.set_password(data['new_password'])

        db.session.commit()
        return user_schema.dump(user)

    @staticmethod
    def delete_user(user_id, current_user_obj):
        """Deletes a user."""
        user = db.session.scalar(db.select(User).filter_by(id=user_id))
        if not user:
            raise APIError("User not found", status_code=404)

        # Only the user themselves or an admin can delete their profile
        if user.id != current_user_obj.id and not current_user_obj.has_role('Admin'):
            raise APIError("Unauthorized to delete this user's profile", status_code=403)
        
        # Prevent admin from deleting themselves (or last admin)
        if user.has_role('Admin'):
            admin_count = db.session.query(User).join(User.role).filter(Role.name == 'Admin').count()
            if admin_count <= 1: # If this is the last admin
                raise APIError("Cannot delete the last admin user", status_code=403)

        db.session.delete(user)
        db.session.commit()
        return {"message": "User deleted successfully"}

    @staticmethod
    def get_all_users():
        """Retrieves all users (admin only)."""
        users = db.session.scalars(db.select(User)).all()
        return users_schema.dump(users)
    
    @staticmethod
    def initiate_password_reset(email):
        """Sends a password reset email to the user."""
        user = db.session.scalar(db.select(User).filter_by(email=email))
        if not user:
            # For security, we don't confirm if the email exists
            current_app.logger.warning(f"Password reset requested for non-existent email: {email}")
            return {"message": "If an account with that email exists, a password reset link has been sent."}
        
        token = user.generate_reset_token()
        reset_link = f"{current_app.config['FRONTEND_URL']}/reset-password/{token}" # FRONTEND_URL needs to be configured
        
        subject = f"Password Reset for {current_app.config['FLASK_APP_NAME']}"
        body = f"""
            Hello {user.username},<br><br>
            You have requested to reset your password for your {current_app.config['FLASK_APP_NAME']} account.<br>
            Please click on the following link to reset your password: <a href="{reset_link}">{reset_link}</a><br><br>
            This link is valid for 1 hour.<br><br>
            If you did not request this, please ignore this email.
        """
        send_email(user.email, subject, body)
        return {"message": "If an account with that email exists, a password reset link has been sent."}

    @staticmethod
    def reset_password(token, new_password):
        """Resets the user's password using a valid token."""
        user = User.verify_reset_token(token)
        if not user:
            raise APIError("Invalid or expired password reset token", status_code=400)
        
        user.set_password(new_password)
        db.session.commit()
        return {"message": "Password reset successfully."}
```