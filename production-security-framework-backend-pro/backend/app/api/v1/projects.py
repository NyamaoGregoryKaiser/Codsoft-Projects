```python
from typing import List, Any
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger
from fastapi_cache.decorator import cache

from app.core.db import get_db
from app.crud.project import crud_project
from app.schemas.project import Project as ProjectSchema, ProjectCreate, ProjectUpdate
from app.models.user import User
from app.models.project import Project
from app.dependencies.auth import get_current_active_user
from app.dependencies.permissions import verify_project_owner, role_required
from app.exceptions.custom_exceptions import EntityNotFoundException, ForbiddenException

router = APIRouter()

@router.get("/", response_model=List[ProjectSchema])
@cache(expire=30) # Cache for 30 seconds
async def read_projects(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Retrieve projects for the current user. Admins can see all projects.
    """
    if current_user.role == "admin":
        projects = await crud_project.get_multi(db, skip=skip, limit=limit)
    else:
        projects = await crud_project.get_multi_by_owner(db, owner_id=current_user.id, skip=skip, limit=limit)
    return projects

@router.post("/", response_model=ProjectSchema, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_in: ProjectCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Create a new project.
    """
    project = await crud_project.create_with_owner(db, obj_in=project_in, owner_id=current_user.id)
    logger.info(f"User {current_user.email} created project: {project.title} (ID: {project.id})")
    return project

@router.get("/{project_id}", response_model=ProjectSchema)
async def read_project(
    project: Project = Depends(verify_project_owner) # Uses permission dependency
) -> Any:
    """
    Get a specific project by ID. Accessible by owner or admin.
    """
    return project

@router.put("/{project_id}", response_model=ProjectSchema)
async def update_project(
    project_in: ProjectUpdate,
    project: Project = Depends(verify_project_owner), # Uses permission dependency
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Update a specific project by ID. Only owner or admin can update.
    """
    updated_project = await crud_project.update(db, db_obj=project, obj_in=project_in)
    logger.info(f"Project {updated_project.title} (ID: {updated_project.id}) updated by owner {updated_project.owner_id}")
    return updated_project

@router.delete("/{project_id}", response_model=ProjectSchema)
async def delete_project(
    project: Project = Depends(verify_project_owner), # Uses permission dependency
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Delete a specific project by ID. Only owner or admin can delete.
    """
    deleted_project = await crud_project.remove(db, id=project.id)
    logger.info(f"Project {deleted_project.title} (ID: {deleted_project.id}) deleted by owner {deleted_project.owner_id}")
    return deleted_project
```