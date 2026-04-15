```python
from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_restx import Resource, Namespace, fields
from marshmallow import ValidationError
from app.schemas.user import UserSchema, UserUpdateSchema
from app.users.services import UserService
from app.models.user import User, UserRole
from app.utils.decorators import admin_required, role_required
from app.extensions import api, cache, limiter
from app.errors import APIError

users_ns = Namespace('users', description='User management operations')

user_schema = UserSchema()
user_update_schema = UserUpdateSchema()
users_list_schema = UserSchema(many=True)

# Flask-RESTX model definitions for Swagger documentation
user_model = users_ns.model('User', {
    'id': fields.Integer(readOnly=True, description='The unique identifier of a user'),
    'username': fields.String(required=True, description='The user username'),
    'email': fields.String(required=True, description='The user email address'),
    'role': fields.String(enum=[role.value for role in UserRole], description='The user role'),
    'is_active': fields.Boolean(description='Whether the user account is active'),
    'created_at': fields.DateTime(readOnly=True, description='Timestamp of creation'),
    'updated_at': fields.DateTime(readOnly=True, description='Timestamp of last update')
})

user_update_model = users_ns.model('UserUpdate', {
    'username': fields.String(description='New username'),
    'email': fields.String(description='New email address'),
    'password': fields.String(description='New password', min_length=8),
    'role': fields.String(enum=[role.value for role in UserRole], description='New user role'),
    'is_active': fields.Boolean(description='New account active status')
})


@users_ns.route('/')
class UserList(Resource):
    @jwt_required()
    @admin_required
    @users_ns.response(200, 'Success', users_list_schema)
    @users_ns.response(401, 'Unauthorized')
    @users_ns.response(403, 'Forbidden (Admin access required)')
    @limiter.limit("20 per minute")
    @cache.cached(timeout=60, key_prefix="all_users_")
    def get(self):
        """List all users (Admin only)."""
        users = UserService.get_all_users()
        return users_list_schema.dump(users), 200

@users_ns.route('/<int:id>')
@users_ns.param('id', 'The user identifier')
class UserResource(Resource):
    @jwt_required()
    @role_required(UserRole.ADMIN, UserRole.EDITOR, UserRole.USER)
    @users_ns.response(200, 'Success', user_model)
    @users_ns.response(401, 'Unauthorized')
    @users_ns.response(403, 'Forbidden')
    @users_ns.response(404, 'User not found')
    @limiter.limit("30 per minute")
    @cache.cached(timeout=120, key_prefix="user_")
    def get(self, id):
        """Get a specific user by ID."""
        current_user_id = get_jwt_identity()
        current_user = UserService.get_user_by_id(current_user_id)

        user = UserService.get_user_by_id(id)
        if not user:
            raise APIError(message="User not found", code=404)
        
        # Regular users can only view their own profile, Admins/Editors can view any
        if current_user.id != user.id and current_user.role == UserRole.USER:
            raise APIError(message="Forbidden: You can only view your own profile.", code=403)
        
        # Include email for the user themselves or for admins/editors
        include_email = (current_user.id == user.id) or \
                        (current_user.role in [UserRole.ADMIN, UserRole.EDITOR])
        
        return user_schema.dump(user, include_email=include_email), 200

    @jwt_required()
    @role_required(UserRole.ADMIN, UserRole.EDITOR, UserRole.USER)
    @users_ns.expect(user_update_model, validate=True, partial=True)
    @users_ns.response(200, 'User updated successfully', user_model)
    @users_ns.response(400, 'Validation Error')
    @users_ns.response(401, 'Unauthorized')
    @users_ns.response(403, 'Forbidden (Cannot update other users or specific fields)')
    @users_ns.response(404, 'User not found')
    @users_ns.response(409, 'Conflict (e.g., username/email already taken)')
    @limiter.limit("10 per minute")
    @cache.clear() # Clear cache related to this user after update
    def put(self, id):
        """Update an existing user.
        Admin/Editor can update any user; Regular user can only update their own profile.
        Regular users cannot change role or active status.
        """
        current_user_id = get_jwt_identity()
        current_user = UserService.get_user_by_id(current_user_id)

        user = UserService.get_user_by_id(id)
        if not user:
            raise APIError(message="User not found", code=404)

        if current_user.id != user.id and current_user.role != UserRole.ADMIN:
            raise APIError(message="Forbidden: You do not have permission to update this user.", code=403)
        
        try:
            update_data = user_update_schema.load(request.json, partial=True)
        except ValidationError as err:
            raise APIError(message="Validation failed", code=400, payload={'errors': err.messages})

        # Role and is_active can only be changed by Admin
        if 'role' in update_data and current_user.role != UserRole.ADMIN:
            raise APIError(message="Forbidden: Only administrators can change user roles.", code=403)
        if 'is_active' in update_data and current_user.role != UserRole.ADMIN:
            raise APIError(message="Forbidden: Only administrators can change user active status.", code=403)
        
        # If user is trying to update their own profile, ensure they are not trying to become an admin
        if current_user.id == user.id and current_user.role != UserRole.ADMIN and \
           'role' in update_data and update_data['role'] != current_user.role:
             raise APIError(message="Forbidden: You cannot change your own role.", code=403)

        updated_user, error = UserService.update_user(user, update_data)
        if error:
            raise APIError(message=error, code=409)

        return user_schema.dump(updated_user), 200

    @jwt_required()
    @admin_required
    @users_ns.response(204, 'User deleted successfully')
    @users_ns.response(401, 'Unauthorized')
    @users_ns.response(403, 'Forbidden (Admin access required)')
    @users_ns.response(404, 'User not found')
    @limiter.limit("5 per minute")
    @cache.clear() # Clear cache related to this user after deletion
    def delete(self, id):
        """Delete a user (Admin only)."""
        current_user_id = get_jwt_identity()
        if current_user_id == id:
            raise APIError(message="Forbidden: You cannot delete your own account.", code=403)

        user = UserService.get_user_by_id(id)
        if not user:
            raise APIError(message="User not found", code=404)
        
        UserService.delete_user(user)
        return '', 204
```