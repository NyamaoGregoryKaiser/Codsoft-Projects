```python
import logging
from typing import List, Any

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi_limiter.depends import RateLimiter
from fastapi_cache.decorator import cache

from app.core.dependencies import get_db, get_current_active_user, verify_user_ownership
from app.core.exceptions import NotFoundException, ForbiddenException, BadRequestException, ConflictException
from app.crud.data_sources import crud_data_source
from app.db.models import User, DataSource as DBDataSource
from app.schemas.data_source import DataSource, DataSourceCreate, DataSourceUpdate
from app.services.data_connector import data_connector # For testing connectivity

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/", response_model=DataSource, status_code=status.HTTP_201_CREATED, summary="Create a new data source")
async def create_data_source(
    data_source_in: DataSourceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> DataSource:
    """
    Create a new data source.
    """
    # Check for existing data source with the same name for this user
    existing_source = await crud_data_source.get_by_name_and_owner(db, name=data_source_in.name, owner_id=current_user.id)
    if existing_source:
        raise ConflictException(f"Data source with name '{data_source_in.name}' already exists for this user.")

    data_source = await crud_data_source.create_with_owner(db, obj_in=data_source_in, owner_id=current_user.id)
    return data_source

@router.get("/", response_model=List[DataSource], summary="Retrieve all data sources for the current user")
@cache(expire=60) # Cache for 1 minute
async def read_data_sources(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> List[DataSource]:
    """
    Retrieve all data sources belonging to the current user.
    Superusers can retrieve all data sources in the system.
    """
    if current_user.is_superuser:
        data_sources = await crud_data_source.get_multi(db, skip=skip, limit=limit)
    else:
        data_sources = await crud_data_source.get_multi_by_owner(db, owner_id=current_user.id, skip=skip, limit=limit)
    return data_sources

@router.get("/{data_source_id}", response_model=DataSource, summary="Retrieve a specific data source by ID")
@cache(expire=300) # Cache for 5 minutes
async def read_data_source(
    data_source_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> DataSource:
    """
    Retrieve a specific data source by its ID.
    """
    data_source = await crud_data_source.get(db, id=data_source_id)
    if not data_source:
        raise NotFoundException("Data source not found.")
    verify_user_ownership(data_source.owner_id, current_user)
    return data_source

@router.put("/{data_source_id}", response_model=DataSource, summary="Update an existing data source")
async def update_data_source(
    data_source_id: int,
    data_source_in: DataSourceUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> DataSource:
    """
    Update an existing data source by its ID.
    """
    data_source = await crud_data_source.get(db, id=data_source_id)
    if not data_source:
        raise NotFoundException("Data source not found.")
    verify_user_ownership(data_source.owner_id, current_user)

    # Check for name conflict if name is being updated
    if data_source_in.name and data_source_in.name != data_source.name:
        existing_source = await crud_data_source.get_by_name_and_owner(db, name=data_source_in.name, owner_id=current_user.id)
        if existing_source and existing_source.id != data_source_id:
            raise ConflictException(f"Data source with name '{data_source_in.name}' already exists for this user.")

    updated_data_source = await crud_data_source.update(db, db_obj=data_source, obj_in=data_source_in)
    return updated_data_source

@router.delete("/{data_source_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a data source")
async def delete_data_source(
    data_source_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> None:
    """
    Delete a data source by its ID.
    """
    data_source = await crud_data_source.get(db, id=data_source_id)
    if not data_source:
        raise NotFoundException("Data source not found.")
    verify_user_ownership(data_source.owner_id, current_user)
    await crud_data_source.remove(db, id=data_source_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.post("/test-connection", summary="Test connectivity to a data source")
@RateLimiter(times=2, seconds=10) # Limit connection tests to prevent abuse
async def test_data_source_connection(
    data_source_in: DataSourceCreate, # Use create schema as a template for connection details
    db: AsyncSession = Depends(get_db), # Still require DB for auth but not for connection itself
    current_user: User = Depends(get_current_active_user),
) -> dict:
    """
    Test connectivity to a data source without saving it.
    """
    try:
        # Create a dummy query for testing. For DBs, query current timestamp. For files, check existence. For APIs, simple GET.
        test_query = ""
        if data_source_in.type == data_source_in.type.DATABASE:
            if data_source_in.db_type == data_source_in.db_type.POSTGRES:
                test_query = "SELECT NOW();"
            elif data_source_in.db_type == data_source_in.db_type.MYSQL:
                test_query = "SELECT NOW();" # or "SELECT CURRENT_TIMESTAMP();"
            else:
                raise BadRequestException(f"Cannot perform connection test for DB type: {data_source_in.db_type}")
        elif data_source_in.type == data_source_in.type.FILE_UPLOAD:
            # For file uploads, a connection test could imply trying to read a dummy file,
            # or just validating the path format if local file paths are expected.
            # Here, we'll try to read the file specified in `data_source_in.query` (as 'file_path')
            # For this endpoint, it makes sense to have a minimal, dummy query if not provided
            if not data_source_in.query:
                raise BadRequestException("A 'query' (file path) must be provided to test file data source.")
            test_query = data_source_in.query
        elif data_source_in.type == data_source_in.type.API:
            # For API, test a simple endpoint or the base URL itself
            # Assuming a simple GET to the base URL or a path like /health
            test_query = data_source_in.config.get("test_path", "/")

        await data_connector.get_data(
            data_source_type=data_source_in.type,
            db_type=data_source_in.db_type,
            connection_string=str(data_source_in.connection_string) if data_source_in.connection_string else None,
            query=test_query,
            config=data_source_in.config
        )
        return {"message": "Connection successful!"}
    except BadRequestException as e:
        raise BadRequestException(f"Connection failed: {e.message}")
    except Exception as e:
        logger.error(f"Unexpected error during connection test: {e}", exc_info=True)
        raise BadRequestException(f"Connection failed due to an unexpected error: {e}")
```