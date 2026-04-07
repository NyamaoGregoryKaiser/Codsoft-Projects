from typing import List, Any
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.database import Database, DatabaseCreate, DatabaseUpdate
from app.db.session import get_async_session
from app.services.database_service import database_service
from app.api.v1.dependencies import CurrentUser, AdminUser, DBSession
from loguru import logger

router = APIRouter()

@router.post("/", response_model=Database, status_code=status.HTTP_201_CREATED, summary="Register a new database")
async def create_new_database(
    db_in: DatabaseCreate,
    db: DBSession,
    current_user: CurrentUser
) -> Any:
    """
    Register a new database instance. The `owner_id` will be set to the ID of the current authenticated user.
    Admins can create databases for other users by specifying `owner_id`.
    """
    if not current_user.is_admin:
        db_in.owner_id = current_user.id # Ensure non-admins only create for themselves
    return await database_service.create_database(db, db_in, current_user)

@router.get("/", response_model=List[Database], summary="Retrieve databases owned by current user or all (Admin)")
async def read_databases(
    db: DBSession,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100
) -> Any:
    """
    Retrieve databases. If the current user is an admin, retrieve all databases.
    Otherwise, retrieve only databases owned by the current user.
    """
    if current_user.is_admin:
        return await database_service.get_all_databases(db, skip=skip, limit=limit)
    return await database_service.get_user_databases(db, current_user.id, skip=skip, limit=limit)

@router.get("/{db_id}", response_model=Database, summary="Retrieve a database by ID")
async def read_database_by_id(
    db_id: int,
    db: DBSession,
    current_user: CurrentUser
) -> Any:
    """
    Retrieve a specific database by ID.
    Accessible if the current user owns the database or is an administrator.
    """
    db_instance = await database_service.get_database(db, db_id)
    # Service layer handles authorization for retrieval
    if db_instance.owner_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this database.")
    return db_instance

@router.put("/{db_id}", response_model=Database, summary="Update a database by ID")
async def update_existing_database(
    db_id: int,
    db_in: DatabaseUpdate,
    db: DBSession,
    current_user: CurrentUser
) -> Any:
    """
    Update details of an existing database.
    Accessible if the current user owns the database or is an administrator.
    """
    return await database_service.update_database(db, db_id, db_in, current_user)

@router.delete("/{db_id}", response_model=Database, summary="Delete a database by ID")
async def delete_existing_database(
    db_id: int,
    db: DBSession,
    current_user: CurrentUser
) -> Any:
    """
    Delete a database.
    Accessible if the current user owns the database or is an administrator.
    """
    return await database_service.delete_database(db, db_id, current_user)