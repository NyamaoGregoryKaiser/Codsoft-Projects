from flask import Blueprint, request, jsonify, current_app
from app.models import db, Project, User
from app.errors import NotFoundError, BadRequestError, ForbiddenError, ValidationError, ConflictError
from app.utils.decorators import jwt_required_custom, owns_project_or_admin, project_exists
from app import cache, limiter

projects_bp = Blueprint('projects', __name__)

@projects_bp.route('/', methods=['POST'])
@jwt_required_custom
@limiter.limit("10 per hour", error_message="Too many project creation attempts.")
def create_project():
    data = request.get_json()
    name = data.get('name')
    description = data.get('description')

    if not name:
        raise BadRequestError("Project name is required.")

    # Check for existing project with same name by the same owner
    existing_project = Project.query.filter_by(name=name, owner_id=request.current_user.id).first()
    if existing_project:
        raise ConflictError(f"You already have a project named '{name}'.")

    new_project = Project(name=name, description=description, owner_id=request.current_user.id)
    db.session.add(new_project)
    db.session.commit()
    cache.delete_memoized(get_all_projects) # Invalidate project list cache
    current_app.logger.info(f"Project created by {request.current_user.username}: {name}")
    return jsonify(new_project.to_dict()), 201

@projects_bp.route('/', methods=['GET'])
@jwt_required_custom
@cache.cached(timeout=60, query_string=True)
def get_all_projects():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    owner_id = request.args.get('owner_id', type=int)
    is_completed = request.args.get('is_completed', type=lambda x: x.lower() == 'true')

    query = Project.query

    # Filter by owner_id (only admin can view other users' projects by owner_id)
    if owner_id:
        if not request.current_user.is_admin and owner_id != request.current_user.id:
            raise ForbiddenError("You do not have permission to view other users' projects.")
        query = query.filter_by(owner_id=owner_id)
    elif not request.current_user.is_admin:
        # Regular users can only see their own projects by default
        query = query.filter_by(owner_id=request.current_user.id)

    if is_completed is not None:
        query = query.filter_by(is_completed=is_completed)

    projects_pagination = query.order_by(Project.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
    projects_data = [project.to_dict() for project in projects_pagination.items]

    return jsonify({
        "projects": projects_data,
        "total": projects_pagination.total,
        "pages": projects_pagination.pages,
        "current_page": projects_pagination.page,
        "per_page": projects_pagination.per_page
    }), 200

@projects_bp.route('/<int:project_id>', methods=['GET'])
@jwt_required_custom
@owns_project_or_admin
@cache.cached(timeout=30, key_prefix='project_details')
def get_project(project_id):
    project = request.current_project # Loaded by decorator
    return jsonify(project.to_dict()), 200

@projects_bp.route('/<int:project_id>', methods=['PUT'])
@jwt_required_custom
@owns_project_or_admin
@limiter.limit("5 per minute", error_message="Too many update requests for a project.")
def update_project(project_id):
    project = request.current_project # Loaded by decorator
    data = request.get_json()
    errors = {}

    if 'name' in data:
        # Check for conflict with other projects of the same owner
        existing_project = Project.query.filter(
            Project.name == data['name'],
            Project.owner_id == project.owner_id,
            Project.id != project_id
        ).first()
        if existing_project:
            errors['name'] = "You already have another project with this name."
        else:
            project.name = data['name']

    if 'description' in data:
        project.description = data['description']
    if 'is_completed' in data:
        project.is_completed = data['is_completed']

    if errors:
        raise ValidationError("Validation failed during project update.", errors=errors)

    db.session.commit()
    cache.delete_memoized(get_project, project_id) # Invalidate cache for this project
    cache.delete_memoized(get_all_projects) # Invalidate project list cache
    current_app.logger.info(f"Project {project_id} updated by {request.current_user.username}")
    return jsonify(project.to_dict()), 200

@projects_bp.route('/<int:project_id>', methods=['DELETE'])
@jwt_required_custom
@owns_project_or_admin
@limiter.limit("2 per minute", error_message="Too many delete requests for projects.")
def delete_project(project_id):
    project = request.current_project # Loaded by decorator

    db.session.delete(project)
    db.session.commit()
    cache.delete_memoized(get_project, project_id) # Invalidate cache for this project
    cache.delete_memoized(get_all_projects) # Invalidate project list cache
    current_app.logger.warning(f"Project {project_id} deleted by {request.current_user.username}")
    return jsonify({"message": "Project deleted successfully"}), 200
```