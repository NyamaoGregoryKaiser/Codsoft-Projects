from flask import Blueprint, request, jsonify, current_app
from app.models import db, User
from app.errors import NotFoundError, BadRequestError, ConflictError, ValidationError
from app.utils.decorators import jwt_required_custom, admin_required
from app import cache, limiter

users_bp = Blueprint('users', __name__)

@users_bp.route('/', methods=['GET'])
@jwt_required_custom
@admin_required
@cache.cached(timeout=60, query_string=True) # Cache for 60 seconds, vary by query string (e.g., /?is_admin=true)
@limiter.limit("20 per minute", error_message="Too many requests for user list.")
def get_all_users():
    # Filtering and pagination example
    is_admin = request.args.get('is_admin', type=lambda x: x.lower() == 'true')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)

    query = User.query
    if is_admin is not None:
        query = query.filter_by(is_admin=is_admin)

    users_pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    users_data = [user.to_dict() for user in users_pagination.items]

    return jsonify({
        "users": users_data,
        "total": users_pagination.total,
        "pages": users_pagination.pages,
        "current_page": users_pagination.page,
        "per_page": users_pagination.per_page
    }), 200

@users_bp.route('/<int:user_id>', methods=['GET'])
@jwt_required_custom
@cache.cached(timeout=30, key_prefix='user_profile') # Cache individual user profile
def get_user(user_id):
    user = User.query.get(user_id)
    if not user:
        raise NotFoundError("User not found.")

    # Allow users to view their own profile, or admin to view any profile
    if user.id != request.current_user.id and not request.current_user.is_admin:
        raise ForbiddenError("You do not have permission to view this user's profile.")

    return jsonify(user.to_dict()), 200

@users_bp.route('/<int:user_id>', methods=['PUT'])
@jwt_required_custom
@limiter.limit("5 per minute", error_message="Too many update requests for user profile.")
def update_user(user_id):
    user = User.query.get(user_id)
    if not user:
        raise NotFoundError("User not found.")

    # Only allow user to update their own profile, or admin to update any profile
    if user.id != request.current_user.id and not request.current_user.is_admin:
        raise ForbiddenError("You do not have permission to update this user's profile.")

    data = request.get_json()
    errors = {}

    # Admin can change is_admin status
    if request.current_user.is_admin and 'is_admin' in data:
        user.is_admin = data['is_admin']

    # Admin can activate/deactivate users
    if request.current_user.is_admin and 'is_active' in data:
        user.is_active = data['is_active']

    if 'username' in data:
        if User.query.filter(User.username == data['username'], User.id != user_id).first():
            errors['username'] = "Username already exists."
        else:
            user.username = data['username']
    if 'email' in data:
        if User.query.filter(User.email == data['email'], User.id != user_id).first():
            errors['email'] = "Email already exists."
        else:
            user.email = data['email']
    if 'password' in data and request.current_user.id == user_id: # Only user can change their own password
        if not data['password']:
            errors['password'] = "Password cannot be empty."
        else:
            user.set_password(data['password'])

    if errors:
        raise ValidationError("Validation failed during user update.", errors=errors)

    db.session.commit()
    cache.delete_memoized(get_user, user_id) # Invalidate cache for this user
    current_app.logger.info(f"User {user_id} updated by {request.current_user.username}")
    return jsonify(user.to_dict()), 200

@users_bp.route('/<int:user_id>', methods=['DELETE'])
@jwt_required_custom
@admin_required # Only admin can delete users
def delete_user(user_id):
    user = User.query.get(user_id)
    if not user:
        raise NotFoundError("User not found.")

    if user.id == request.current_user.id:
        raise BadRequestError("You cannot delete your own account via this endpoint. Please contact support.")

    db.session.delete(user)
    db.session.commit()
    cache.delete_memoized(get_user, user_id) # Invalidate cache
    cache.delete_memoized(get_all_users) # Invalidate list cache
    current_app.logger.warning(f"User {user_id} deleted by admin {request.current_user.username}")
    return jsonify({"message": "User deleted successfully"}), 200
```