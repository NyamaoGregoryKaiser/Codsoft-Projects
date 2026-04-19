from flask import Blueprint, request, jsonify, current_app
from app.models import db, Task, Project, User
from app.errors import NotFoundError, BadRequestError, ForbiddenError, ValidationError
from app.utils.decorators import jwt_required_custom, owns_project_or_admin, owns_task_or_project_owner_or_admin, project_exists, task_exists
from app import cache, limiter

tasks_bp = Blueprint('tasks', __name__)

VALID_TASK_STATUSES = ['todo', 'in-progress', 'completed', 'blocked']
VALID_TASK_PRIORITIES = ['low', 'medium', 'high', 'critical']

@tasks_bp.route('/project/<int:project_id>', methods=['POST'])
@jwt_required_custom
@owns_project_or_admin # Ensure user owns the project or is admin to add tasks
@limiter.limit("20 per hour", error_message="Too many task creation attempts.")
def create_task(project_id):
    project = request.current_project # Loaded by decorator
    data = request.get_json()
    title = data.get('title')
    description = data.get('description')
    assignee_id = data.get('assignee_id')
    status = data.get('status', 'todo')
    priority = data.get('priority', 'medium')
    due_date = data.get('due_date')

    if not title:
        raise BadRequestError("Task title is required.")
    if status not in VALID_TASK_STATUSES:
        raise BadRequestError(f"Invalid status. Must be one of: {', '.join(VALID_TASK_STATUSES)}")
    if priority not in VALID_TASK_PRIORITIES:
        raise BadRequestError(f"Invalid priority. Must be one of: {', '.join(VALID_TASK_PRIORITIES)}")

    assignee = None
    if assignee_id:
        assignee = User.query.get(assignee_id)
        if not assignee:
            raise NotFoundError(f"Assignee with ID {assignee_id} not found.")

    try:
        if due_date:
            from datetime import datetime
            due_date = datetime.fromisoformat(due_date.replace('Z', '+00:00')) # Handle 'Z' for UTC
    except ValueError:
        raise BadRequestError("Invalid due_date format. Use ISO 8601 (e.g., '2023-12-31T23:59:59Z').")

    new_task = Task(
        title=title,
        description=description,
        project_id=project.id,
        assignee_id=assignee.id if assignee else None,
        status=status,
        priority=priority,
        due_date=due_date
    )
    db.session.add(new_task)
    db.session.commit()
    cache.delete_memoized(get_project_tasks, project_id) # Invalidate task list for this project
    cache.delete_memoized(get_all_tasks) # Invalidate all tasks list
    current_app.logger.info(f"Task '{title}' created in project {project_id} by {request.current_user.username}")
    return jsonify(new_task.to_dict()), 201

@tasks_bp.route('/project/<int:project_id>', methods=['GET'])
@jwt_required_custom
@owns_project_or_admin # Ensure user owns the project or is admin to view tasks
@cache.cached(timeout=30, query_string=True)
def get_project_tasks(project_id):
    project = request.current_project # Loaded by decorator
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    status_filter = request.args.get('status')
    priority_filter = request.args.get('priority')
    assignee_filter = request.args.get('assignee_id', type=int)

    query = Task.query.filter_by(project_id=project.id)

    if status_filter:
        if status_filter not in VALID_TASK_STATUSES:
            raise BadRequestError(f"Invalid status filter. Must be one of: {', '.join(VALID_TASK_STATUSES)}")
        query = query.filter_by(status=status_filter)
    if priority_filter:
        if priority_filter not in VALID_TASK_PRIORITIES:
            raise BadRequestError(f"Invalid priority filter. Must be one of: {', '.join(VALID_TASK_PRIORITIES)}")
        query = query.filter_by(priority=priority_filter)
    if assignee_filter:
        query = query.filter_by(assignee_id=assignee_filter)

    tasks_pagination = query.order_by(Task.due_date.asc(), Task.priority.desc()).paginate(page=page, per_page=per_page, error_out=False)
    tasks_data = [task.to_dict() for task in tasks_pagination.items]

    return jsonify({
        "tasks": tasks_data,
        "total": tasks_pagination.total,
        "pages": tasks_pagination.pages,
        "current_page": tasks_pagination.page,
        "per_page": tasks_pagination.per_page
    }), 200

@tasks_bp.route('/<int:task_id>', methods=['GET'])
@jwt_required_custom
@owns_task_or_project_owner_or_admin # User can view if they own task, project, or are admin
@cache.cached(timeout=30, key_prefix='task_details')
def get_task(task_id):
    task = request.current_task # Loaded by decorator
    return jsonify(task.to_dict()), 200

@tasks_bp.route('/<int:task_id>', methods=['PUT'])
@jwt_required_custom
@owns_task_or_project_owner_or_admin # User can update if they own task, project, or are admin
@limiter.limit("10 per minute", error_message="Too many update requests for a task.")
def update_task(task_id):
    task = request.current_task # Loaded by decorator
    data = request.get_json()
    errors = {}

    if 'title' in data:
        task.title = data['title']
    if 'description' in data:
        task.description = data['description']
    if 'assignee_id' in data:
        assignee_id = data['assignee_id']
        if assignee_id:
            assignee = User.query.get(assignee_id)
            if not assignee:
                errors['assignee_id'] = f"Assignee with ID {assignee_id} not found."
            else:
                task.assignee_id = assignee.id
        else:
            task.assignee_id = None # Unassign
    if 'status' in data:
        if data['status'] not in VALID_TASK_STATUSES:
            errors['status'] = f"Invalid status. Must be one of: {', '.join(VALID_TASK_STATUSES)}"
        else:
            task.status = data['status']
    if 'priority' in data:
        if data['priority'] not in VALID_TASK_PRIORITIES:
            errors['priority'] = f"Invalid priority. Must be one of: {', '.join(VALID_TASK_PRIORITIES)}"
        else:
            task.priority = data['priority']
    if 'due_date' in data:
        if data['due_date'] is None:
            task.due_date = None
        else:
            try:
                from datetime import datetime
                task.due_date = datetime.fromisoformat(data['due_date'].replace('Z', '+00:00'))
            except ValueError:
                errors['due_date'] = "Invalid due_date format. Use ISO 8601 (e.g., '2023-12-31T23:59:59Z')."

    if errors:
        raise ValidationError("Validation failed during task update.", errors=errors)

    db.session.commit()
    cache.delete_memoized(get_task, task_id) # Invalidate specific task cache
    cache.delete_memoized(get_project_tasks, task.project_id) # Invalidate project tasks cache
    cache.delete_memoized(get_all_tasks) # Invalidate all tasks cache
    current_app.logger.info(f"Task {task_id} updated by {request.current_user.username}")
    return jsonify(task.to_dict()), 200

@tasks_bp.route('/<int:task_id>', methods=['DELETE'])
@jwt_required_custom
@owns_task_or_project_owner_or_admin # User can delete if they own task, project, or are admin
@limiter.limit("5 per minute", error_message="Too many delete requests for tasks.")
def delete_task(task_id):
    task = request.current_task # Loaded by decorator

    db.session.delete(task)
    db.session.commit()
    cache.delete_memoized(get_task, task_id) # Invalidate specific task cache
    cache.delete_memoized(get_project_tasks, task.project_id) # Invalidate project tasks cache
    cache.delete_memoized(get_all_tasks) # Invalidate all tasks cache
    current_app.logger.warning(f"Task {task_id} deleted by {request.current_user.username}")
    return jsonify({"message": "Task deleted successfully"}), 200

# Optional: Global task list (accessible by admin, or user's assigned/owned tasks)
@tasks_bp.route('/', methods=['GET'])
@jwt_required_custom
@cache.cached(timeout=60, query_string=True, unless=lambda: request.current_user.is_admin) # Cache for non-admins
def get_all_tasks():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    status_filter = request.args.get('status')
    priority_filter = request.args.get('priority')
    project_filter = request.args.get('project_id', type=int)
    assignee_filter = request.args.get('assignee_id', type=int)

    query = Task.query

    if not request.current_user.is_admin:
        # Non-admins can only see tasks where they are the assignee or owner of the project
        query = query.join(Project, Task.project_id == Project.id).filter(
            (Task.assignee_id == request.current_user.id) |
            (Project.owner_id == request.current_user.id)
        )
    else:
        # Admin can filter by any assignee
        if assignee_filter:
            query = query.filter_by(assignee_id=assignee_filter)

    if status_filter:
        if status_filter not in VALID_TASK_STATUSES:
            raise BadRequestError(f"Invalid status filter. Must be one of: {', '.join(VALID_TASK_STATUSES)}")
        query = query.filter_by(status=status_filter)
    if priority_filter:
        if priority_filter not in VALID_TASK_PRIORITIES:
            raise BadRequestError(f"Invalid priority filter. Must be one of: {', '.join(VALID_TASK_PRIORITIES)}")
        query = query.filter_by(priority=priority_filter)
    if project_filter:
        query = query.filter_by(project_id=project_filter)


    tasks_pagination = query.order_by(Task.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
    tasks_data = [task.to_dict() for task in tasks_pagination.items]

    return jsonify({
        "tasks": tasks_data,
        "total": tasks_pagination.total,
        "pages": tasks_pagination.pages,
        "current_page": tasks_pagination.page,
        "per_page": tasks_pagination.per_page
    }), 200
```