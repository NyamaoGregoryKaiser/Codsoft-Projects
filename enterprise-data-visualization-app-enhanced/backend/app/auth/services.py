```python
from backend.app.models import User, Role, user_schema
from backend.app.extensions import db
from flask_jwt_extended import create_access_token, create_refresh_token
from werkzeug.exceptions import Conflict, Unauthorized, InternalServerError

class AuthService:
    @staticmethod
    def register_user(username, email, password, role_names=None):
        if User.query.filter_by(username=username).first():
            raise Conflict("Username already exists.")
        if User.query.filter_by(email=email).first():
            raise Conflict("Email already registered.")

        user = User(username=username, email=email)
        user.set_password(password)

        if role_names:
            for role_name in role_names:
                role = Role.query.filter_by(name=role_name).first()
                if not role:
                    # Optionally create role if it doesn't exist, or raise error
                    # For production, roles should be predefined.
                    role = Role(name=role_name)
                    db.session.add(role)
                    db.session.flush() # Ensure role gets an ID if newly created
                user.roles.append(role)
        else:
            # Assign a default 'user' role if none specified
            default_role = Role.query.filter_by(name='user').first()
            if not default_role:
                default_role = Role(name='user', description='Standard user role')
                db.session.add(default_role)
            user.roles.append(default_role)


        try:
            user.save()
            return user
        except Exception as e:
            db.session.rollback()
            raise InternalServerError(f"Could not register user: {e}")

    @staticmethod
    def login_user(username, password):
        user = User.query.filter_by(username=username).first()
        if not user or not user.check_password(password):
            raise Unauthorized("Invalid credentials.")

        access_token = create_access_token(identity=user.id, fresh=True)
        refresh_token = create_refresh_token(identity=user.id)
        return {
            "user": user_schema.dump(user),
            "access_token": access_token,
            "refresh_token": refresh_token
        }

```