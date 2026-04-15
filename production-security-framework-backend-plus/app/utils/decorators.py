```python
from functools import wraps
from flask import jsonify, current_app
from flask_jwt_extended import get_jwt_identity
from app.models.user import User, UserRole
from app.extensions import db

def role_required(*roles):
    """
    Decorator to restrict access to endpoints based on user roles.
    Takes one or more UserRole enums or strings representing roles.
    """
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            current_user_id = get_jwt_identity()
            if not current_user_id:
                current_app.logger.warning(f"Unauthorized access attempt: No JWT identity found for role check.")
                return jsonify({"message": "Authorization required"}), 401

            user = db.session.get(User, current_user_id)
            if not user:
                current_app.logger.warning(f"User {current_user_id} not found for role check.")
                return jsonify({"message": "User not found"}), 404

            # Check if user has any of the required roles
            has_access = False
            for role_str_or_enum in roles:
                if isinstance(role_str_or_enum, UserRole):
                    if user.role == role_str_or_enum:
                        has_access = True
                        break
                elif isinstance(role_str_or_enum, str):
                    if user.role.value == role_str_or_enum:
                        has_access = True
                        break
            
            if not has_access:
                current_app.logger.warning(f"User {user.username} (ID: {user.id}, Role: {user.role.value}) attempted to access role-restricted resource. Required roles: {roles}")
                return jsonify({"message": "Insufficient permissions"}), 403

            return fn(*args, **kwargs)
        return decorator
    return wrapper

def admin_required(fn):
    """Decorator to restrict access to ADMIN users."""
    return role_required(UserRole.ADMIN)(fn)

def editor_or_admin_required(fn):
    """Decorator to restrict access to EDITOR or ADMIN users."""
    return role_required(UserRole.EDITOR, UserRole.ADMIN)(fn)

def owner_or_admin_required(model_class):
    """
    Decorator to restrict access to the resource owner or an ADMIN user.
    Assumes the decorated function takes an `id` argument for the resource.
    The resource model must have an `author_id` attribute.
    """
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            current_user_id = get_jwt_identity()
            if not current_user_id:
                current_app.logger.warning(f"Unauthorized access attempt: No JWT identity found for owner check.")
                return jsonify({"message": "Authorization required"}), 401

            user = db.session.get(User, current_user_id)
            if not user:
                current_app.logger.warning(f"User {current_user_id} not found for owner check.")
                return jsonify({"message": "User not found"}), 404

            resource_id = kwargs.get('id')
            if not resource_id:
                current_app.logger.error(f"Decorator @owner_or_admin_required used on function without 'id' argument.")
                return jsonify({"message": "Internal server error: Resource ID missing."}), 500

            resource = db.session.get(model_class, resource_id)
            if not resource:
                return jsonify({"message": f"{model_class.__name__} not found"}), 404

            # Check if current user is the owner or an admin
            if user.id == resource.author_id or user.role == UserRole.ADMIN:
                return fn(*args, **kwargs)
            else:
                current_app.logger.warning(f"User {user.username} (ID: {user.id}, Role: {user.role.value}) attempted to access owner-restricted resource (ID: {resource_id}).")
                return jsonify({"message": "You do not have permission to perform this action"}), 403
        return decorator
    return wrapper

```