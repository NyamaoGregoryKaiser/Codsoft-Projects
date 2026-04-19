from functools import wraps
from flask import request
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity, get_jwt
from app.models import User, Project, Task, db
from app.errors import UnauthorizedError, ForbiddenError, NotFoundError, BadRequestError
from flask import current_app

def jwt_required_custom(fn):
    """
    Custom JWT required decorator that also loads the user object.
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if user is None:
            raise UnauthorizedError("User not found or token invalid.")
        if not user.is_active:
            raise ForbiddenError("User account is inactive.")
        request.current_user = user # Attach user object to request
        return fn(*args, **kwargs)
    return wrapper

def admin_required(fn):
    """
    Decorator to ensure the current user is an admin.
    Assumes jwt_required_custom has already run.
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if not hasattr(request, 'current_user') or not request.current_user:
            raise UnauthorizedError("Authentication required.")
        if not request.current_user.is_admin:
            raise ForbiddenError("Administrator access required.")
        return fn(*args, **kwargs)
    return wrapper

def owns_project_or_admin(fn):
    """
    Decorator to check if the current user owns the project or is an admin.
    The project ID is expected as a 'project_id' keyword argument.
    Assumes jwt_required_custom has already run.
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if not hasattr(request, 'current_user') or not request.current_user:
            raise UnauthorizedError("Authentication required.")

        project_id = kwargs.get('project_id')
        if not project_id:
            raise BadRequestError("Project ID missing from URL.")

        project = Project.query.get(project_id)
        if not project:
            raise NotFoundError("Project not found.")

        if project.owner_id != request.current_user.id and not request.current_user.is_admin:
            raise ForbiddenError("You do not have permission to access this project.")

        request.current_project = project # Attach project object to request
        return fn(*args, **kwargs)
    return wrapper

def owns_task_or_project_owner_or_admin(fn):
    """
    Decorator to check if the current user owns the task, owns the parent project, or is an admin.
    The task ID is expected as a 'task_id' keyword argument.
    Assumes jwt_required_custom has already run.
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if not hasattr(request, 'current_user') or not request.current_user:
            raise UnauthorizedError("Authentication required.")

        task_id = kwargs.get('task_id')
        if not task_id:
            raise BadRequestError("Task ID missing from URL.")

        task = Task.query.get(task_id)
        if not task:
            raise NotFoundError("Task not found.")

        project = Project.query.get(task.project_id)
        if not project:
            current_app.logger.error(f"Task {task.id} references non-existent project {task.project_id}")
            raise NotFoundError("Associated project not found.")

        is_task_owner = task.assignee_id == request.current_user.id
        is_project_owner = project.owner_id == request.current_user.id
        is_admin = request.current_user.is_admin

        if not (is_task_owner or is_project_owner or is_admin):
            raise ForbiddenError("You do not have permission to access this task.")

        request.current_task = task # Attach task object to request
        request.current_project = project # Attach project object to request
        return fn(*args, **kwargs)
    return wrapper

def project_exists(fn):
    """
    Decorator to check if a project exists based on project_id in kwargs.
    Attaches the project object to request.current_project.
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        project_id = kwargs.get('project_id')
        if not project_id:
            raise BadRequestError("Project ID missing from URL.")
        project = Project.query.get(project_id)
        if not project:
            raise NotFoundError("Project not found.")
        request.current_project = project
        return fn(*args, **kwargs)
    return wrapper

def task_exists(fn):
    """
    Decorator to check if a task exists based on task_id in kwargs.
    Attaches the task object to request.current_task.
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        task_id = kwargs.get('task_id')
        if not task_id:
            raise BadRequestError("Task ID missing from URL.")
        task = Task.query.get(task_id)
        if not task:
            raise NotFoundError("Task not found.")
        request.current_task = task
        return fn(*args, **kwargs)
    return wrapper
```