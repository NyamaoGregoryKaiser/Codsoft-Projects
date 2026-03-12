from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from webargs.flaskparser import use_args
from backend.app.services.user_service import UserService, UserUpdateSchema
from backend.app.utils.decorators import role_required
from backend.app.extensions import db
from backend.app.models.user import User

bp = Blueprint('users', __name__)

@bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """
    Get Current User Profile
    ---
    get:
      summary: Retrieve the profile of the currently authenticated user
      security:
        - BearerAuth: []
      responses:
        200:
          description: Current user profile
          schema:
            $ref: '#/definitions/UserSchema'
        401:
          description: Unauthorized
        404:
          description: User not found
    """
    user_id = get_jwt_identity()
    user_data = UserService.get_user_by_id(user_id)
    return jsonify(user_data), 200

@bp.route('/me', methods=['PUT'])
@jwt_required()
@use_args(UserUpdateSchema(), location="json", partial=True)
def update_current_user(args):
    """
    Update Current User Profile
    ---
    put:
      summary: Update the profile of the currently authenticated user
      security:
        - BearerAuth: []
      parameters:
        - in: body
          name: body
          schema:
            type: object
            properties:
              username:
                type: string
                example: johndoe_new
              email:
                type: string
                format: email
                example: john.new@example.com
              old_password:
                type: string
                format: password
                example: StrongPassword123!
              new_password:
                type: string
                format: password
                example: NewerStrongPassword456!
      responses:
        200:
          description: User profile updated successfully
          schema:
            $ref: '#/definitions/UserSchema'
        401:
          description: Unauthorized (invalid credentials for password change)
        404:
          description: User not found
        409:
          description: Conflict (username/email already taken)
        422:
          description: Validation error
    """
    user_id = get_jwt_identity()
    current_user_obj = db.session.scalar(db.select(User).filter_by(id=user_id))
    updated_user = UserService.update_user(user_id, args, current_user_obj)
    return jsonify(updated_user), 200

@bp.route('/me', methods=['DELETE'])
@jwt_required()
def delete_current_user():
    """
    Delete Current User Account
    ---
    delete:
      summary: Delete the account of the currently authenticated user
      security:
        - BearerAuth: []
      responses:
        200:
          description: User account deleted successfully
          schema:
            type: object
            properties:
              message: {type: string}
        401:
          description: Unauthorized
        403:
          description: Forbidden (e.g., cannot delete last admin)
        404:
          description: User not found
    """
    user_id = get_jwt_identity()
    current_user_obj = db.session.scalar(db.select(User).filter_by(id=user_id))
    result = UserService.delete_user(user_id, current_user_obj)
    return jsonify(result), 200

# Admin-only endpoints
@bp.route('/', methods=['GET'])
@jwt_required()
@role_required('Admin')
def get_all_users():
    """
    Get All Users (Admin Only)
    ---
    get:
      summary: Retrieve a list of all users (Admin access required)
      security:
        - BearerAuth: []
      responses:
        200:
          description: A list of user profiles
          schema:
            type: array
            items:
              $ref: '#/definitions/UserSchema'
        401:
          description: Unauthorized
        403:
          description: Forbidden (insufficient permissions)
    """
    users = UserService.get_all_users()
    return jsonify(users), 200

@bp.route('/<int:user_id>', methods=['GET'])
@jwt_required()
@role_required('Admin')
def get_user(user_id):
    """
    Get User by ID (Admin Only)
    ---
    get:
      summary: Retrieve a user profile by ID (Admin access required)
      security:
        - BearerAuth: []
      parameters:
        - in: path
          name: user_id
          type: integer
          required: true
          description: The ID of the user to retrieve
      responses:
        200:
          description: User profile
          schema:
            $ref: '#/definitions/UserSchema'
        401:
          description: Unauthorized
        403:
          description: Forbidden (insufficient permissions)
        404:
          description: User not found
    """
    user_data = UserService.get_user_by_id(user_id)
    return jsonify(user_data), 200

@bp.route('/<int:user_id>', methods=['PUT'])
@jwt_required()
@role_required('Admin')
@use_args(UserUpdateSchema(), location="json", partial=True)
def update_user_by_id(args, user_id):
    """
    Update User by ID (Admin Only)
    ---
    put:
      summary: Update a user profile by ID (Admin access required)
      security:
        - BearerAuth: []
      parameters:
        - in: path
          name: user_id
          type: integer
          required: true
          description: The ID of the user to update
        - in: body
          name: body
          schema:
            type: object
            properties:
              username:
                type: string
                example: jane_admin
              email:
                type: string
                format: email
                example: jane.admin@example.com
              new_password:
                type: string
                format: password
                example: AdminNewPass123!
      responses:
        200:
          description: User profile updated successfully
          schema:
            $ref: '#/definitions/UserSchema'
        401:
          description: Unauthorized
        403:
          description: Forbidden (insufficient permissions)
        404:
          description: User not found
        409:
          description: Conflict (username/email already taken)
        422:
          description: Validation error
    """
    current_user_id = get_jwt_identity()
    current_user_obj = db.session.scalar(db.select(User).filter_by(id=current_user_id))
    updated_user = UserService.update_user(user_id, args, current_user_obj)
    return jsonify(updated_user), 200

@bp.route('/<int:user_id>', methods=['DELETE'])
@jwt_required()
@role_required('Admin')
def delete_user_by_id(user_id):
    """
    Delete User by ID (Admin Only)
    ---
    delete:
      summary: Delete a user account by ID (Admin access required)
      security:
        - BearerAuth: []
      parameters:
        - in: path
          name: user_id
          type: integer
          required: true
          description: The ID of the user to delete
      responses:
        200:
          description: User account deleted successfully
          schema:
            type: object
            properties:
              message: {type: string}
        401:
          description: Unauthorized
        403:
          description: Forbidden (e.g., cannot delete last admin)
        404:
          description: User not found
    """
    current_user_id = get_jwt_identity()
    current_user_obj = db.session.scalar(db.select(User).filter_by(id=current_user_id))
    result = UserService.delete_user(user_id, current_user_obj)
    return jsonify(result), 200
```