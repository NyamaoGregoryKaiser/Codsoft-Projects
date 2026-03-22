```python
from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Callable

from app.models.user import User
from app.models.project import Project
from app.models.task import Task
from app.crud.project import crud_project
from app.crud.task import crud_task
from app.dependencies.auth import get_current_active_user
from app.core.db import get_db

async def verify_project_owner(
    project_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Project:
    """Dependency to verify if the current user owns the project."""
    project = await crud_project.get(db, project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    if project.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this project")
    return project

async def verify_task_access(
    task_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Task:
    """Dependency to verify if the current user has access to the task."""
    task = await crud_task.get_with_relations(db, task_id=task_id)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    
    # User can access if:
    # 1. They are the project owner
    # 2. They are assigned to the task
    # 3. They are an admin
    if (task.project.owner_id != current_user.id and
        task.assigned_to_id != current_user.id and
        current_user.role != "admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this task")
    return task

def role_required(required_role: str) -> Callable:
    """
    A factory function that creates a dependency to check if the current user
    has a specific role or higher (admin is always highest).
    """
    async def check_role(current_user: User = Depends(get_current_active_user)) -> User:
        role_map = {"user": 1, "admin": 2}
        if role_map.get(current_user.role, 0) < role_map.get(required_role, 0) and current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"User does not have the required role: {required_role}"
            )
        return current_user
    return check_role
```