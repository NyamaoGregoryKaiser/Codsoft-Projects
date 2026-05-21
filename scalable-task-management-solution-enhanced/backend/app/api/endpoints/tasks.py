from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi_limiter.depends import RateLimiter

from app.dependencies.common import CommonPagination, CurrentUser, DBSession
from app.crud.task import task as crud_task
from app.crud.project import project as crud_project
from app.crud.user import user as crud_user
from app.crud.task_comment import task_comment as crud_task_comment
from app.schemas.task import Task, TaskCreate, TaskUpdate
from app.schemas.task_comment import TaskComment, TaskCommentCreate, TaskCommentUpdate
from app.core.exceptions import NotFoundException, ForbiddenException, BadRequestException, ConflictException
from app.services.cache import CacheService, get_cache_service

router = APIRouter(prefix="/tasks", tags=["Tasks"])

@router.get("/", response_model=List[Task], summary="Retrieve multiple tasks")
@RateLimiter(times=10, seconds=1) # Limit to 10 requests per second
async def read_tasks(
    db: DBSession,
    pagination: CommonPagination,
    current_user: CurrentUser, # Requires authentication
    project_id: Optional[int] = Query(None, description="Filter tasks by project ID"),
    assignee_id: Optional[int] = Query(None, description="Filter tasks by assignee ID"),
    cache_service: Annotated[CacheService, Depends(get_cache_service)]
) -> List[Task]:
    """
    Retrieve multiple tasks.
    Filters can be applied by `project_id` or `assignee_id`.
    Users can only see tasks related to projects they own, or tasks assigned to them,
    unless they are a superuser.
    """
    cache_key_parts = ["tasks"]
    if project_id:
        cache_key_parts.append(f"project_{project_id}")
    if assignee_id:
        cache_key_parts.append(f"assignee_{assignee_id}")
    cache_key_parts.append(f"user_{current_user.id}") # User-specific cache
    cache_key_parts.append(f"skip_{pagination['skip']}_limit_{pagination['limit']}")
    cache_key = "_".join(cache_key_parts)

    cached_tasks = await cache_service.get(cache_key)
    if cached_tasks:
        return [Task.model_validate(t) for t in cached_tasks]

    # Superusers can fetch any tasks
    if current_user.is_superuser:
        if project_id:
            tasks = await crud_task.get_multi_by_project(db, project_id=project_id, **pagination)
        elif assignee_id:
            tasks = await crud_task.get_multi_by_assignee(db, assignee_id=assignee_id, **pagination)
        else:
            tasks = await crud_task.get_multi_tasks(db, **pagination)
    else:
        # Regular users can only see tasks in projects they own OR tasks assigned to them
        if project_id:
            project = await crud_project.get(db, id=project_id)
            if not project or project.owner_id != current_user.id:
                raise ForbiddenException(detail="Not authorized to view tasks in this project.")
            tasks = await crud_task.get_multi_by_project(db, project_id=project_id, **pagination)
        elif assignee_id:
            if assignee_id != current_user.id:
                raise ForbiddenException(detail="Not authorized to view tasks assigned to other users.")
            tasks = await crud_task.get_multi_by_assignee(db, assignee_id=assignee_id, **pagination)
        else:
            # If no filters, return tasks assigned to current user and tasks in projects owned by current user
            assigned_tasks = await crud_task.get_multi_by_assignee(db, assignee_id=current_user.id, **pagination)
            owned_projects_tasks = []
            user_projects = await crud_project.get_multi_by_owner(db, owner_id=current_user.id)
            for project in user_projects:
                owned_projects_tasks.extend(await crud_task.get_multi_by_project(db, project_id=project.id, **pagination))
            
            # Combine and deduplicate
            all_tasks_dict = {task.id: task for task in assigned_tasks + owned_projects_tasks}
            tasks = list(all_tasks_dict.values())
            tasks.sort(key=lambda t: t.id) # Ensure consistent order for pagination
            tasks = tasks[pagination['skip']:pagination['skip']+pagination['limit']]

    await cache_service.set(cache_key, [t.model_dump() for t in tasks])
    return tasks


@router.post("/", response_model=Task, status_code=status.HTTP_201_CREATED, summary="Create a new task")
async def create_task(
    *,
    db: DBSession,
    task_in: TaskCreate,
    current_user: CurrentUser, # Requires authentication
    cache_service: Annotated[CacheService, Depends(get_cache_service)]
) -> Task:
    """
    Create a new task.
    The task's project must exist and be owned by the current user (or current user is superuser).
    """
    project = await crud_project.get(db, id=task_in.project_id)
    if not project:
        raise NotFoundException(detail="Project not found.")
    
    if project.owner_id != current_user.id and not current_user.is_superuser:
        raise ForbiddenException(detail="Not authorized to create tasks in this project.")

    # Check if assignee exists if provided
    if task_in.assignee_id:
        assignee = await crud_user.get(db, id=task_in.assignee_id)
        if not assignee:
            raise BadRequestException(detail="Assignee user not found.")

    # Create task with creator_id as current_user.id
    db_task = await crud_task.create(db, obj_in=task_in, creator_id=current_user.id) # Inject creator_id
    
    # Eager load related data for response
    await db.refresh(db_task, attribute_names=["project", "assignee", "creator"])
    
    await cache_service.delete_prefix("tasks_") # Invalidate all task list caches
    await cache_service.delete_prefix(f"projects_user_{project.owner_id}_") # Invalidate owner's project list
    if current_user.is_superuser:
        await cache_service.delete_prefix("projects_all_") # Invalidate all projects list
        
    return db_task

# Helper to inject creator_id into create obj_in for Task (similar to Project owner_id)
class TaskCRUDWithCreator(crud_task.__class__):
    async def create(self, db: AsyncSession, *, obj_in: TaskCreate, creator_id: int) -> Task:
        db_obj = Task(
            title=obj_in.title,
            description=obj_in.description,
            status=obj_in.status,
            priority=obj_in.priority,
            due_date=obj_in.due_date,
            project_id=obj_in.project_id,
            assignee_id=obj_in.assignee_id,
            creator_id=creator_id
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

task_crud_with_creator = TaskCRUDWithCreator(Task)

@router.get("/{task_id}", response_model=Task, summary="Retrieve a single task by ID")
async def read_task(
    task_id: int,
    db: DBSession,
    current_user: CurrentUser, # Requires authentication
    cache_service: Annotated[CacheService, Depends(get_cache_service)]
) -> Task:
    """
    Retrieve a specific task by ID.
    Only users involved in the task (creator, assignee, project owner) or superusers can view it.
    """
    cache_key = f"task_{task_id}_details"
    cached_task = await cache_service.get(cache_key)
    if cached_task:
        return Task.model_validate(cached_task)

    task = await crud_task.get_task_details(db, task_id=task_id)
    if not task:
        raise NotFoundException(detail="Task not found")

    # Authorization check
    can_view = current_user.is_superuser or \
               task.creator_id == current_user.id or \
               task.assignee_id == current_user.id or \
               (task.project and task.project.owner_id == current_user.id)
    
    if not can_view:
        raise ForbiddenException(detail="Not authorized to view this task.")

    await cache_service.set(cache_key, task.model_dump())
    return task

@router.put("/{task_id}", response_model=Task, summary="Update a task")
async def update_task(
    *,
    db: DBSession,
    task_id: int,
    task_in: TaskUpdate,
    current_user: CurrentUser, # Requires authentication
    cache_service: Annotated[CacheService, Depends(get_cache_service)]
) -> Task:
    """
    Update a task by ID.
    Only the task creator, project owner, or a superuser can update a task.
    Assignees can update status/description/priority for tasks assigned to them.
    """
    task = await crud_task.get_task_details(db, task_id=task_id) # Get with details for auth
    if not task:
        raise NotFoundException(detail="Task not found")

    # Authorization check
    can_update_all_fields = current_user.is_superuser or \
                            task.creator_id == current_user.id or \
                            (task.project and task.project.owner_id == current_user.id)

    can_update_limited_fields = task.assignee_id == current_user.id and \
                                (task_in.model_dump(exclude_unset=True).keys() <= {"status", "description", "priority", "due_date"})

    if not (can_update_all_fields or can_update_limited_fields):
        raise ForbiddenException(detail="Not authorized to update this task or certain fields.", error_code="NOT_AUTHORIZED_TASK_UPDATE")

    # Prevent changing creator_id via API
    if task_in.creator_id is not None:
        raise BadRequestException(detail="Cannot change task creator.", error_code="CREATOR_IMMUTABLE")

    # Check if assignee exists if assignee_id is being updated
    if task_in.assignee_id is not None and task_in.assignee_id != task.assignee_id:
        assignee = await crud_user.get(db, id=task_in.assignee_id)
        if not assignee:
            raise BadRequestException(detail="New assignee user not found.")

    updated_task = await crud_task.update(db, db_obj=task, obj_in=task_in)
    
    await cache_service.delete(f"task_{task_id}_details") # Invalidate specific task cache
    await cache_service.delete_prefix("tasks_") # Invalidate all task list caches
    await cache_service.delete_prefix(f"projects_user_{task.project.owner_id}_") # Invalidate owner's project list
    if current_user.is_superuser:
        await cache_service.delete_prefix("projects_all_") # Invalidate all projects list
    
    # Ensure related objects are loaded for the response model
    await db.refresh(updated_task, attribute_names=["project", "assignee", "creator"])

    return updated_task

@router.delete("/{task_id}", response_model=Task, summary="Delete a task")
async def delete_task(
    *,
    db: DBSession,
    task_id: int,
    current_user: CurrentUser, # Requires authentication
    cache_service: Annotated[CacheService, Depends(get_cache_service)]
) -> Task:
    """
    Delete a task by ID.
    Only the task creator, project owner, or a superuser can delete a task.
    """
    task = await crud_task.get(db, id=task_id)
    if not task:
        raise NotFoundException(detail="Task not found")

    project = await crud_project.get(db, id=task.project_id) # Need project owner for authorization
    if not project:
        raise NotFoundException(detail="Associated project not found.")

    # Authorization check
    can_delete = current_user.is_superuser or \
                 task.creator_id == current_user.id or \
                 project.owner_id == current_user.id

    if not can_delete:
        raise ForbiddenException(detail="Not authorized to delete this task.")

    deleted_task = await crud_task.remove(db, id=task_id)
    
    await cache_service.delete(f"task_{task_id}_details")
    await cache_service.delete_prefix("tasks_")
    await cache_service.delete_prefix(f"projects_user_{project.owner_id}_")
    if current_user.is_superuser:
        await cache_service.delete_prefix("projects_all_")

    return deleted_task


# Task Comments Endpoints
@router.post("/{task_id}/comments", response_model=TaskComment, status_code=status.HTTP_201_CREATED, summary="Add a comment to a task")
async def create_task_comment(
    *,
    db: DBSession,
    task_id: int,
    comment_in: TaskCommentCreate,
    current_user: CurrentUser,
    cache_service: Annotated[CacheService, Depends(get_cache_service)]
) -> TaskComment:
    """
    Add a new comment to a task.
    Users can comment on tasks they can view (creator, assignee, project owner, superuser).
    """
    task = await crud_task.get(db, id=task_id)
    if not task:
        raise NotFoundException(detail="Task not found.")

    project = await crud_project.get(db, id=task.project_id) # For auth
    if not project:
        raise NotFoundException(detail="Associated project not found for task.")

    # Authorization check (can view task)
    can_comment = current_user.is_superuser or \
                  task.creator_id == current_user.id or \
                  task.assignee_id == current_user.id or \
                  project.owner_id == current_user.id
    
    if not can_comment:
        raise ForbiddenException(detail="Not authorized to comment on this task.")

    db_comment = await crud_task_comment.create(db, obj_in=comment_in, task_id=task_id, user_id=current_user.id) # Inject task_id, user_id
    
    await db.refresh(db_comment, attribute_names=["user"]) # Eager load user for response
    
    await cache_service.delete(f"task_{task_id}_details") # Invalidate task details cache to show new comment
    await cache_service.delete_prefix(f"task_{task_id}_comments_") # Invalidate comments list for this task

    return db_comment

class TaskCommentCRUDWithUser(crud_task_comment.__class__):
    async def create(self, db: AsyncSession, *, obj_in: TaskCommentCreate, task_id: int, user_id: int) -> TaskComment:
        db_obj = TaskComment(
            comment_text=obj_in.comment_text,
            task_id=task_id,
            user_id=user_id
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

task_comment_crud_with_user = TaskCommentCRUDWithUser(TaskComment)


@router.get("/{task_id}/comments", response_model=List[TaskComment], summary="Retrieve comments for a task")
async def read_task_comments(
    task_id: int,
    db: DBSession,
    pagination: CommonPagination,
    current_user: CurrentUser,
    cache_service: Annotated[CacheService, Depends(get_cache_service)]
) -> List[TaskComment]:
    """
    Retrieve all comments for a specific task.
    Requires view authorization for the task.
    """
    task = await crud_task.get(db, id=task_id)
    if not task:
        raise NotFoundException(detail="Task not found.")

    project = await crud_project.get(db, id=task.project_id)
    if not project:
        raise NotFoundException(detail="Associated project not found for task.")

    can_view = current_user.is_superuser or \
               task.creator_id == current_user.id or \
               task.assignee_id == current_user.id or \
               project.owner_id == current_user.id

    if not can_view:
        raise ForbiddenException(detail="Not authorized to view comments for this task.")

    cache_key = f"task_{task_id}_comments_skip_{pagination['skip']}_limit_{pagination['limit']}"
    cached_comments = await cache_service.get(cache_key)
    if cached_comments:
        return [TaskComment.model_validate(c) for c in cached_comments]

    comments = await crud_task_comment.get_multi_by_task(db, task_id=task_id, **pagination)
    await cache_service.set(cache_key, [c.model_dump() for c in comments])
    return comments

@router.delete("/comments/{comment_id}", response_model=TaskComment, summary="Delete a task comment")
async def delete_task_comment(
    *,
    db: DBSession,
    comment_id: int,
    current_user: CurrentUser,
    cache_service: Annotated[CacheService, Depends(get_cache_service)]
) -> TaskComment:
    """
    Delete a specific task comment.
    Only the comment author, task creator, project owner, or superuser can delete a comment.
    """
    comment = await crud_task_comment.get_comment_with_user(db, comment_id=comment_id)
    if not comment:
        raise NotFoundException(detail="Comment not found.")

    task = await crud_task.get(db, id=comment.task_id)
    if not task:
        raise NotFoundException(detail="Associated task not found for comment.")

    project = await crud_project.get(db, id=task.project_id)
    if not project:
        raise NotFoundException(detail="Associated project not found for task.")

    # Authorization check
    can_delete = current_user.is_superuser or \
                 comment.user_id == current_user.id or \
                 task.creator_id == current_user.id or \
                 project.owner_id == current_user.id

    if not can_delete:
        raise ForbiddenException(detail="Not authorized to delete this comment.")

    deleted_comment = await crud_task_comment.remove(db, id=comment_id)
    
    await cache_service.delete(f"task_{comment.task_id}_details")
    await cache_service.delete_prefix(f"task_{comment.task_id}_comments_")

    return deleted_comment