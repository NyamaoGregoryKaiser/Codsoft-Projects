from functools import wraps
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from flask import jsonify, current_app
from backend.app.extensions import db
from backend.app.models.user import User
from backend.app.utils.errors import APIError
from backend.app.extensions import cache

def role_required(role_name):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request() # Ensure JWT is present and valid
            user_id = get_jwt_identity()

            # Try to get user role from cache first
            cached_role = cache.get(f'user_role_{user_id}')
            if cached_role == role_name:
                return fn(*args, **kwargs)
            elif cached_role and cached_role != role_name:
                current_app.logger.warning(f"User {user_id} (role: {cached_role}) attempted to access {fn.__name__} requiring {role_name}")
                raise APIError("Access Forbidden: Insufficient permissions", status_code=403)

            # If not in cache or role mismatch, fetch from DB
            user = db.session.scalar(db.select(User).filter_by(id=user_id))
            if not user or not user.active:
                raise APIError("User not found or inactive", status_code=401)

            # Cache the user's role
            cache.set(f'user_role_{user_id}', user.role.name, timeout=current_app.config['CACHE_DEFAULT_TIMEOUT'])

            if user.has_role(role_name):
                return fn(*args, **kwargs)
            else:
                current_app.logger.warning(f"User {user_id} (role: {user.role.name}) attempted to access {fn.__name__} requiring {role_name}")
                raise APIError("Access Forbidden: Insufficient permissions", status_code=403)
        return wrapper
    return decorator
```