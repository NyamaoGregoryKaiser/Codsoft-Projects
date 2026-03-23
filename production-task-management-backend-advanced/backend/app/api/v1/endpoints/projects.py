from typing import Any, List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api import deps
from app.db.session import get_db
from app.schemas.project import Project, ProjectCreate, ProjectUpdate
from app.crud.project import project as crud_project
from app.core.exceptions import EntityNotFoundException, ForbiddenException
from app.services.cache import invalidate_cache, cache

router = APIRouter()

@router.get("/", response_model=List[Project])
@cache(expire=60) # Cache project list for 60 seconds
async def read_projects(
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: deps.CurrentUser = Depends(deps.get_current_active_user_or_admin),
) -> Any:
    """
    Retrieve projects. (Accessible by any active user)
    Admin/Superuser can see all projects. Regular users see their owned projects.
    """
    if current_user.is_superuser or current_user.role == "admin":
        projects = await crud_project.get_multi(db, skip=skip, limit=limit)
    else:
        projects = await crud_project.get_multi_by_owner(db, owner_id=current_user.id, skip=skip, limit=limit)
    return projects

@router.post("/", response_model=Project, status_code=status.HTTP_201_CREATED)
async def create_project(
    *,
    db: AsyncSession = Depends(get_db),
    project_in: ProjectCreate,
    current_user: deps.CurrentUser = Depends(deps.get_current_active_user_or_admin),
) -> Any:
    """
    Create new project.
    """
    project = await crud_project.create_with_owner(db, obj_in=project_in, owner_id=current_user.id)
    await invalidate_cache("read_projects")
    return project

@router.put("/{project_id}", response_model=Project)
async def update_project(
    *,
    db: AsyncSession = Depends(get_db),
    project_id: int,
    project_in: ProjectUpdate,
    current_user: deps.CurrentUser = Depends(deps.get_current_active_user_or_admin),
) -> Any:
    """
    Update a project. (Owner or Admin/Superuser)
    """
    project = await crud_project.get(db, id=project_id)
    if not project:
        raise EntityNotFoundException("Project", project_id)
    if not (project.owner_id == current_user.id or current_user.is_superuser or current_user.role == "admin"):
        raise ForbiddenException("Not authorized to update this project.")
    
    project = await crud_project.update(db, db_obj=project, obj_in=project_in)
    await invalidate_cache("read_projects")
    await invalidate_cache(f"read_project_by_id:{project_id}")
    return project

@router.get("/{project_id}", response_model=Project)
@cache(expire=60) # Cache single project for 60 seconds
async def read_project_by_id(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: deps.CurrentUser = Depends(deps.get_current_active_user_or_admin),
) -> Any:
    """
    Get a specific project by ID. (Owner or Admin/Superuser)
    """
    project = await crud_project.get(db, id=project_id)
    if not project:
        raise EntityNotFoundException("Project", project_id)
    if not (project.owner_id == current_user.id or current_user.is_superuser or current_user.role == "admin"):
        raise ForbiddenException("Not authorized to access this project.")
    return project

@router.delete("/{project_id}", response_model=Project)
async def delete_project(
    *,
    db: AsyncSession = Depends(get_db),
    project_id: int,
    current_user: deps.CurrentUser = Depends(deps.get_current_active_admin_or_superuser), # Only Admin/Superuser can delete
) -> Any:
    """
    Delete a project. (Admin/Superuser only)
    """
    project = await crud_project.get(db, id=project_id)
    if not project:
        raise EntityNotFoundException("Project", project_id)
    
    # Optional: If you want project owner to delete their own projects
    # if not (project.owner_id == current_user.id or current_user.is_superuser or current_user.role == "admin"):
    #     raise ForbiddenException("Not authorized to delete this project.")

    project = await crud_project.remove(db, id=project_id)
    await invalidate_cache("read_projects")
    await invalidate_cache(f"read_project_by_id:{project_id}")
    return project