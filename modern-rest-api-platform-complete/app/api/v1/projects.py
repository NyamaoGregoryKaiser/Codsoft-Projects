from typing import Any, List

from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_active_user, get_current_admin_user, rate_limiter
from app.crud.project import project as crud_project
from app.crud.user import user as crud_user
from app.schemas.project import Project, ProjectCreate, ProjectUpdate, ProjectDetail
from app.models.user import User
from app.core.exceptions import NotFoundException, ForbiddenException

router = APIRouter()

@router.get("/", response_model=List[Project], summary="Retrieve all projects for current user", dependencies=[Depends(rate_limiter)])
async def read_projects(
    db: AsyncSession = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Retrieve projects owned by the current authenticated user.
    Admin users can retrieve all projects.
    """
    if current_user.is_admin:
        projects = await crud_project.get_multi(db, skip=skip, limit=limit)
    else:
        projects = await crud_project.get_multi_by_owner(db, owner_id=current_user.id, skip=skip, limit=limit)
    return projects

@router.post("/", response_model=Project, status_code=status.HTTP_201_CREATED, summary="Create a new project")
async def create_project(
    *,
    db: AsyncSession = Depends(get_db),
    project_in: ProjectCreate,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Create a new project. The current user will be set as the owner.
    """
    project = await crud_project.create_with_owner(db, obj_in=project_in, owner_id=current_user.id)
    return project

@router.get("/{project_id}", response_model=ProjectDetail, summary="Retrieve project by ID")
async def read_project_by_id(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get a specific project by ID.
    Access is restricted to the project owner or admin users.
    """
    project = await crud_project.get_with_tasks(db, project_id=project_id)
    if not project:
        raise NotFoundException(detail="Project not found")
    if not current_user.is_admin and project.owner_id != current_user.id:
        raise ForbiddenException(detail="Not enough permissions to access this project")
    return project

@router.put("/{project_id}", response_model=Project, summary="Update project by ID")
async def update_project(
    *,
    db: AsyncSession = Depends(get_db),
    project_id: int,
    project_in: ProjectUpdate,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Update a project's information.
    Only the project owner or admin users can update a project.
    """
    project = await crud_project.get(db, id=project_id)
    if not project:
        raise NotFoundException(detail="Project not found")
    if not current_user.is_admin and project.owner_id != current_user.id:
        raise ForbiddenException(detail="Not enough permissions to update this project")
    
    project = await crud_project.update(db, db_obj=project, obj_in=project_in)
    return project

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete project by ID")
async def delete_project(
    *,
    db: AsyncSession = Depends(get_db),
    project_id: int,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Delete a project. This will also delete all associated tasks and comments due to CASCADE.
    Only the project owner or admin users can delete a project.
    """
    project = await crud_project.get(db, id=project_id)
    if not project:
        raise NotFoundException(detail="Project not found")
    if not current_user.is_admin and project.owner_id != current_user.id:
        raise ForbiddenException(detail="Not enough permissions to delete this project")
    
    await crud_project.remove(db, id=project_id)
    return {"message": "Project deleted successfully"}

```