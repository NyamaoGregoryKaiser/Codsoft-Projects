from typing import Any, List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api import deps
from app.db.session import get_db
from app.schemas.task import Task, TaskCreate, TaskUpdate
from app.crud.task import task as crud_task
from app.crud.project import project as crud_project
from app.crud.user import user as crud_user
from app.core.exceptions import EntityNotFoundException, ForbiddenException
from app.services.cache import invalidate_cache, cache
from app.services import notification

router = APIRouter()

@router.get("/", response_model=List[Task])
@cache(expire=30) # Cache task list for 30 seconds
async def read_tasks(
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    project_id: int = None, # Optional filter
    current_user: deps.CurrentUser = Depends(deps.get_current_active_user_or_admin),
) -> Any:
    """
    Retrieve tasks. Filter by project_id if provided.
    Users can only see tasks within projects they own or are assigned to,
    unless they are admin/superuser.
    """
    if current_user.is_superuser or current_user.role == "admin":
        if project_id:
            tasks = await crud_task.get_multi_by_project(db, project_id=project_id, skip=skip, limit=limit)
        else:
            tasks = await crud_task.get_multi(db, skip=skip, limit=limit)
    else:
        # Regular user: filter tasks by projects they own or are assigned to
        # This can be more complex and might involve joining tables in CRUD or filtering post-fetch
        # For simplicity, we'll fetch all and filter or rely on existing crud methods
        # A more robust solution would be to add a custom `get_multi_by_user_access` to crud_task.
        # Here, we'll fetch tasks from projects they own. Assignee tasks require more complex filtering.
        user_projects = await crud_project.get_multi_by_owner(db, owner_id=current_user.id)
        if project_id and project_id not in [p.id for p in user_projects]:
            raise ForbiddenException("Not authorized to access tasks in this project.")
        
        project_ids = [p.id for p in user_projects]
        if project_id:
            project_ids = [project_id] # If specific project requested and user owns it
        
        tasks_list = []
        for p_id in project_ids:
            tasks_list.extend(await crud_task.get_multi_by_project(db, project_id=p_id, skip=skip, limit=limit))
        
        # Also include tasks assigned to the user directly, regardless of project ownership
        # This requires a new CRUD method, or separate query for simplicity.
        # For this example, let's keep it to project ownership and assignee check later.
        
        # Filter for tasks assigned to the current user, or within projects they own
        all_accessible_tasks = []
        for task_item in tasks_list:
            if task_item.project.owner_id == current_user.id or task_item.assignee_id == current_user.id:
                all_accessible_tasks.append(task_item)

        # Remove duplicates if a task could be in multiple lists (e.g. owned project + assigned to user)
        seen_task_ids = set()
        unique_accessible_tasks = []
        for task_item in all_accessible_tasks:
            if task_item.id not in seen_task_ids:
                unique_accessible_tasks.append(task_item)
                seen_task_ids.add(task_item.id)
        
        tasks = unique_accessible_tasks
    
    return tasks

@router.post("/", response_model=Task, status_code=status.HTTP_201_CREATED)
async def create_task(
    *,
    db: AsyncSession = Depends(get_db),
    task_in: TaskCreate,
    current_user: deps.CurrentUser = Depends(deps.get_current_active_user_or_admin),
) -> Any:
    """
    Create new task. (User must be owner of the project or admin/superuser)
    """
    project = await crud_project.get(db, id=task_in.project_id)
    if not project:
        raise EntityNotFoundException("Project", task_in.project_id)
    if not (project.owner_id == current_user.id or current_user.is_superuser or current_user.role == "admin"):
        raise ForbiddenException("Not authorized to create tasks in this project.")
    
    task_created = await crud_task.create_with_creator(db, obj_in=task_in, creator_id=current_user.id)
    await invalidate_cache("read_tasks")
    await invalidate_cache(f"read_task_by_id:{task_created.id}")
    
    # Send notification if assigned
    if task_created.assignee_id and task_created.assignee_id != current_user.id:
        assignee_user = await crud_user.get(db, id=task_created.assignee_id)
        if assignee_user:
            await notification.notify_task_assignment(
                assignee_user.id,
                task_created.title,
                project.title,
                task_link=f"/tasks/{task_created.id}" # Example link
            )
    
    return task_created

@router.put("/{task_id}", response_model=Task)
async def update_task(
    *,
    db: AsyncSession = Depends(get_db),
    task_id: int,
    task_in: TaskUpdate,
    current_user: deps.CurrentUser = Depends(deps.get_current_active_user_or_admin),
) -> Any:
    """
    Update a task. (Creator, Assignee, Project Owner or Admin/Superuser)
    """
    task = await crud_task.get(db, id=task_id)
    if not task:
        raise EntityNotFoundException("Task", task_id)
    
    project = await crud_project.get(db, id=task.project_id)
    if not project: # Should not happen if task exists and has project_id
        raise EntityNotFoundException("Project", task.project_id)
    
    can_edit = (
        task.creator_id == current_user.id or
        task.assignee_id == current_user.id or
        project.owner_id == current_user.id or
        current_user.is_superuser or
        current_user.role == "admin"
    )
    if not can_edit:
        raise ForbiddenException("Not authorized to update this task.")

    old_status = task.status
    old_assignee_id = task.assignee_id

    updated_task = await crud_task.update(db, db_obj=task, obj_in=task_in)
    await invalidate_cache("read_tasks")
    await invalidate_cache(f"read_task_by_id:{task_id}")
    
    # Notifications
    if updated_task.status != old_status:
        affected_users = [updated_task.creator_id, updated_task.assignee_id, updated_task.project.owner_id]
        affected_users = list(set([uid for uid in affected_users if uid is not None])) # Unique and non-None
        if current_user.id in affected_users:
            affected_users.remove(current_user.id) # Don't notify self
        
        await notification.notify_task_status_change(
            updated_task.id,
            updated_task.title,
            old_status,
            updated_task.status,
            project.title,
            affected_users,
            task_link=f"/tasks/{updated_task.id}"
        )
    
    if updated_task.assignee_id != old_assignee_id:
        # Notify new assignee
        if updated_task.assignee_id and updated_task.assignee_id != current_user.id:
            assignee_user = await crud_user.get(db, id=updated_task.assignee_id)
            if assignee_user:
                await notification.notify_task_assignment(
                    assignee_user.id,
                    updated_task.title,
                    project.title,
                    task_link=f"/tasks/{updated_task.id}"
                )
        # Optional: Notify old assignee if they are different and were assigned
        if old_assignee_id and old_assignee_id != current_user.id and old_assignee_id != updated_task.assignee_id:
             await notification.send_notification(
                old_assignee_id,
                f"You have been unassigned from task '{updated_task.title}' in project '{project.title}'.",
                task_link=f"/tasks/{updated_task.id}",
                notification_type="task_unassignment"
            )

    return updated_task

@router.get("/{task_id}", response_model=Task)
@cache(expire=30) # Cache single task for 30 seconds
async def read_task_by_id(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: deps.CurrentUser = Depends(deps.get_current_active_user_or_admin),
) -> Any:
    """
    Get a specific task by ID. (Creator, Assignee, Project Owner or Admin/Superuser)
    """
    task = await crud_task.get(db, id=task_id)
    if not task:
        raise EntityNotFoundException("Task", task_id)
    
    project = await crud_project.get(db, id=task.project_id)
    if not project:
        raise EntityNotFoundException("Project", task.project_id) # Should not happen

    can_view = (
        task.creator_id == current_user.id or
        task.assignee_id == current_user.id or
        project.owner_id == current_user.id or
        current_user.is_superuser or
        current_user.role == "admin"
    )
    if not can_view:
        raise ForbiddenException("Not authorized to access this task.")
    
    return task

@router.delete("/{task_id}", response_model=Task)
async def delete_task(
    *,
    db: AsyncSession = Depends(get_db),
    task_id: int,
    current_user: deps.CurrentUser = Depends(deps.get_current_active_admin_or_superuser), # Admin/Superuser or Project Owner
) -> Any:
    """
    Delete a task. (Admin/Superuser or Project Owner)
    """
    task = await crud_task.get(db, id=task_id)
    if not task:
        raise EntityNotFoundException("Task", task_id)
    
    project = await crud_project.get(db, id=task.project_id)
    if not project:
        raise EntityNotFoundException("Project", task.project_id) # Should not happen

    can_delete = (
        project.owner_id == current_user.id or
        current_user.is_superuser or
        current_user.role == "admin"
    )
    if not can_delete:
        raise ForbiddenException("Not authorized to delete this task.")

    deleted_task = await crud_task.remove(db, id=task_id)
    await invalidate_cache("read_tasks")
    await invalidate_cache(f"read_task_by_id:{task_id}")
    return deleted_task