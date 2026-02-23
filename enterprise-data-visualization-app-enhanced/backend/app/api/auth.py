```python
from flask import request, jsonify
from flask_jwt_extended import jwt_required, create_access_token, get_jwt_identity, get_jwt
from werkzeug.exceptions import Conflict, Unauthorized, InternalServerError, BadRequest
from backend.app.api import api_bp
from backend.app.auth.services import AuthService
from backend.app.models import user_schema
from backend.app.extensions import limiter

@api_bp.route('/register', methods=['POST'])
@limiter.limit("5 per hour") # Limit registration attempts
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    role_names = data.get('roles') # Optional, for admin creation

    if not username or not email or not password:
        raise BadRequest("Username, email, and password are required.")

    try:
        user = AuthService.register_user(username, email, password, role_names)
        return jsonify(user_schema.dump(user)), 201
    except (Conflict, BadRequest, InternalServerError) as e:
        return jsonify({"msg": e.description, "code": e.code}), e.code
    except Exception as e:
        return jsonify({"msg": str(e), "code": 500}), 500

@api_bp.route('/login', methods=['POST'])
@limiter.limit("10 per minute") # Limit login attempts
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        raise BadRequest("Username and password are required.")

    try:
        auth_data = AuthService.login_user(username, password)
        return jsonify(auth_data), 200
    except Unauthorized as e:
        return jsonify({"msg": e.description, "code": e.code}), e.code
    except Exception as e:
        return jsonify({"msg": str(e), "code": 500}), 500

@api_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    current_user_id = get_jwt_identity()
    new_access_token = create_access_token(identity=current_user_id, fresh=False)
    return jsonify(access_token=new_access_token), 200

@api_bp.route('/protected', methods=['GET'])
@jwt_required()
def protected():
    current_user_id = get_jwt_identity()
    claims = get_jwt()
    return jsonify(logged_in_as=current_user_id, roles=claims.get('roles', [])), 200

```