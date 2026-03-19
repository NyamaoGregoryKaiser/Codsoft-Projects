```python
from functools import wraps
from flask_jwt_extended import verify_jwt_in_request, get_jwt, get_jwt_identity, current_user
from flask import jsonify, current_app

def admin_required(fn):
    """
    Decorator to ensure the current authenticated user has admin privileges.
    Assumes `jwt_required()` and `jwt.user_lookup_loader` have already been applied,
    making `current_user` available.
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if not current_user or not current_user.is_admin:
            current_app.logger.warning(f"Unauthorized access attempt by user ID '{current_user.id if current_user else 'N/A'}' to admin resource.")
            return jsonify({"msg": "Administrators only!"}), 403
        return fn(*args, **kwargs)
    return wrapper

def jwt_and_user_loader(fn):
    """
    Combines `jwt_required` functionality with `current_user` lookup.
    Ensures a JWT is present and loads the user into `current_user`.
    This is often used after @jwt_required() to ensure current_user is set.
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request() # This populates `get_jwt_identity()` and allows `jwt.user_lookup_loader` to run
        if current_user is None:
            current_app.logger.error(f"JWT found but user (ID: {get_jwt_identity()}) could not be loaded from database.")
            return jsonify({"msg": "User associated with token not found"}), 404
        return fn(*args, **kwargs)
    return wrapper

def cache_response(timeout=60, key_prefix='view'):
    """
    Decorator to cache the response of a view function.
    """
    from app import cache # Import here to avoid circular dependency issues

    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            cache_key = f"{key_prefix}:{request.path}:{request.query_string.decode('utf-8')}"
            response = cache.get(cache_key)
            if response is None:
                response = fn(*args, **kwargs)
                cache.set(cache_key, response, timeout=timeout)
                current_app.logger.debug(f"Cached response for key: {cache_key}")
            else:
                current_app.logger.debug(f"Serving cached response for key: {cache_key}")
            return response
        return wrapper
    return decorator
```