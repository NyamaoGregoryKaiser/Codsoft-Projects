```python
from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt

def role_required(role_name):
    """
    Decorator to check if the current user has the specified role.
    Assumes JWT is present and `additional_claims_loader` adds 'roles'.
    """
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            if "roles" in claims and role_name in claims["roles"]:
                return fn(*args, **kwargs)
            else:
                return jsonify({"msg": "Role not authorized", "code": 403}), 403
        return decorator
    return wrapper

```