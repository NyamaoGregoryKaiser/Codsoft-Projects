from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi_limiter.depends import RateLimiter

from app.dependencies.common import CommonPagination, CurrentUser, DBSession
from app.crud.project import project as crud_project
from app.schemas.project import Project, ProjectCreate, ProjectUpdate
from app.core.exceptions import NotFoundException, ForbiddenException
from app.services.cache import CacheService, get_cache_service

router = APIRouter(prefix="/projects", tags=["Projects"])

@router.get("/", response_model=List[Project], summary="Retrieve multiple projects")
@RateLimiter(times=5, seconds=1) # Limit to 5 requests per second
async def read_projects(
    db: DBSession,
    pagination: CommonPagination,
    current_user: CurrentUser, # Requires authentication
    cache_service: Annotated[CacheService, Depends(get_cache_service)]
) -> List[Project]:
    """
    Retrieve multiple projects.
    Returns projects owned by the current user, or all projects if the user is a superuser.
    """
    cache_key = f"projects_user_{current_user.id}_skip_{pagination['skip']}_limit_{pagination['limit']}"
    if current_user.is_superuser:
        cache_key = f"projects_all_skip_{pagination['skip']}_limit_{pagination['limit']}"

    cached_projects = await cache_service.get(cache_key)
    if cached_projects:
        return [Project.model_validate(p) for p in cached_projects]

    if current_user.is_superuser:
        projects = await crud_project.get_projects_with_tasks_count(
            db, skip=pagination["skip"], limit=pagination["limit"]
        )
    else:
        projects = await crud_project.get_projects_with_tasks_count(
            db, owner_id=current_user.id, skip=pagination["skip"], limit=pagination["limit"]
        )

    await cache_service.set(cache_key, [p.model_dump() for p in projects])
    return projects

@router.post("/", response_model=Project, status_code=status.HTTP_201_CREATED, summary="Create a new project")
async def create_project(
    *,
    db: DBSession,
    project_in: ProjectCreate,
    current_user: CurrentUser, # Requires authentication
    cache_service: Annotated[CacheService, Depends(get_cache_service)]
) -> Project:
    """
    Create a new project. The current user will be set as the owner.
    """
    project = await crud_project.create(db, obj_in=project_in, owner_id=current_user.id) # Add owner_id to obj_in
    project.owner = current_user # Manually set owner for response
    project.tasks_count = 0 # New project has 0 tasks
    
    await cache_service.delete_prefix(f"projects_user_{current_user.id}_") # Invalidate user's project list
    if current_user.is_superuser:
        await cache_service.delete_prefix("projects_all_") # Invalidate all projects list
    
    return project

# Helper to inject owner_id into create obj_in if not present in CRUDBase (which expects all fields)
# This is a common pattern when some fields are set by the server, not the client
# Override CRUDBase create method for project to handle this.
class ProjectCRUDWithOwner(crud_project.__class__):
    async def create(self, db: AsyncSession, *, obj_in: ProjectCreate, owner_id: int) -> Project:
        db_obj = Project(
            name=obj_in.name,
            description=obj_in.description,
            owner_id=owner_id
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

project_crud_with_owner = ProjectCRUDWithOwner(Project)


@router.get("/{project_id}", response_model=Project, summary="Retrieve a single project by ID")
async def read_project(
    project_id: int,
    db: DBSession,
    current_user: CurrentUser, # Requires authentication
    cache_service: Annotated[CacheService, Depends(get_cache_service)]
) -> Project:
    """
    Retrieve a specific project by ID.
    Only the project owner or a superuser can view a project.
    """
    cache_key = f"project_{project_id}_details"
    cached_project = await cache_service.get(cache_key)
    if cached_project:
        return Project.model_validate(cached_project)

    project = await crud_project.get_project_details(db, project_id=project_id)
    if not project:
        raise NotFoundException(detail="Project not found")

    if project.owner_id != current_user.id and not current_user.is_superuser:
        raise ForbiddenException(detail="Not authorized to view this project.")

    await cache_service.set(cache_key, project.model_dump())
    return project

@router.put("/{project_id}", response_model=Project, summary="Update a project")
async def update_project(
    *,
    db: DBSession,
    project_id: int,
    project_in: ProjectUpdate,
    current_user: CurrentUser, # Requires authentication
    cache_service: Annotated[CacheService, Depends(get_cache_service)]
) -> Project:
    """
    Update a project by ID.
    Only the project owner or a superuser can update a project.
    """
    project = await crud_project.get_with_owner(db, project_id=project_id)
    if not project:
        raise NotFoundException(detail="Project not found")

    if project.owner_id != current_user.id and not current_user.is_superuser:
        raise ForbiddenException(detail="Not authorized to update this project.")

    updated_project = await crud_project.update(db, db_obj=project, obj_in=project_in)
    
    await cache_service.delete(f"project_{project_id}_details") # Invalidate specific project cache
    await cache_service.delete_prefix(f"projects_user_{project.owner_id}_") # Invalidate owner's project list
    if current_user.is_superuser:
        await cache_service.delete_prefix("projects_all_") # Invalidate all projects list

    # Ensure owner is re-attached for the response model if it was eager-loaded before update
    if not updated_project.owner:
        updated_project.owner = project.owner
    # Re-fetch tasks count
    updated_project.tasks_count = project.tasks_count # Preserve tasks_count if not explicitly updated or re-fetched

    return updated_project

@router.delete("/{project_id}", response_model=Project, summary="Delete a project")
async def delete_project(
    *,
    db: DBSession,
    project_id: int,
    current_user: CurrentUser, # Requires authentication
    cache_service: Annotated[CacheService, Depends(get_cache_service)]
) -> Project:
    """
    Delete a project by ID.
    Only the project owner or a superuser can delete a project.
    """
    project = await crud_project.get(db, id=project_id)
    if not project:
        raise NotFoundException(detail="Project not found")

    if project.owner_id != current_user.id and not current_user.is_superuser:
        raise ForbiddenException(detail="Not authorized to delete this project.")

    deleted_project = await crud_project.remove(db, id=project_id)
    
    await cache_service.delete(f"project_{project_id}_details")
    await cache_service.delete_prefix(f"projects_user_{project.owner_id}_")
    await cache_service.delete_prefix("tasks_project_") # Invalidate tasks related to this project
    await cache_service.delete_prefix("projects_all_")

    return deleted_project