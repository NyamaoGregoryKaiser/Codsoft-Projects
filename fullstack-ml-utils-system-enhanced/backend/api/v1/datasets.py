```python
from typing import Annotated, List
from fastapi import APIRouter, Depends, UploadFile, File, Form, status, Query
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.schemas.dataset import DatasetCreate, DatasetUpdate, Dataset, DatasetStats
from backend.models import User as DBUser
from backend.dependencies import get_current_active_user
from backend.services.dataset_service import DatasetService
from backend.core.exception_handlers import ResourceNotFoundError, UnauthorizedAccessError
from loguru import logger

router = APIRouter()
dataset_service = DatasetService() # Instantiate once globally

@router.post("/", response_model=Dataset, status_code=status.HTTP_201_CREATED)
async def create_upload_dataset(
    current_user: Annotated[DBUser, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)],
    file: Annotated[UploadFile, File(description="CSV or Parquet file")],
    name: Annotated[str, Form(min_length=3, max_length=100)],
    description: Annotated[str, Form(None, max_length=500)] = None
):
    """
    Upload a new dataset (CSV or Parquet file).
    """
    dataset_create = DatasetCreate(name=name, description=description)
    try:
        db_dataset = await dataset_service.create_dataset(db, current_user, dataset_create, file)
        return db_dataset
    except Exception as e:
        logger.error(f"Failed to upload dataset for user {current_user.id}: {e}")
        raise

@router.get("/", response_model=List[Dataset])
def read_datasets(
    current_user: Annotated[DBUser, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)]
):
    """
    Retrieve all datasets owned by the current user.
    """
    datasets = dataset_service.get_all_datasets(db, current_user)
    return datasets

@router.get("/{dataset_id}", response_model=Dataset)
def read_dataset(
    dataset_id: int,
    current_user: Annotated[DBUser, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)]
):
    """
    Retrieve a specific dataset by its ID.
    """
    try:
        db_dataset = dataset_service.get_dataset(db, dataset_id)
        if db_dataset.owner_id != current_user.id and not current_user.is_superuser:
            raise UnauthorizedAccessError("You are not authorized to view this dataset.")
        return db_dataset
    except ResourceNotFoundError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)
    except UnauthorizedAccessError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)

@router.patch("/{dataset_id}", response_model=Dataset)
def update_dataset(
    dataset_id: int,
    dataset_update: DatasetUpdate,
    current_user: Annotated[DBUser, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)]
):
    """
    Update an existing dataset's metadata (name, description).
    """
    try:
        db_dataset = dataset_service.update_dataset(db, current_user, dataset_id, dataset_update)
        return db_dataset
    except ResourceNotFoundError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)
    except UnauthorizedAccessError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)

@router.delete("/{dataset_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_dataset(
    dataset_id: int,
    current_user: Annotated[DBUser, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)]
):
    """
    Delete a dataset by its ID.
    """
    try:
        dataset_service.delete_dataset(db, current_user, dataset_id)
        return {"message": "Dataset deleted successfully."}
    except ResourceNotFoundError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)
    except UnauthorizedAccessError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)

@router.get("/{dataset_id}/stats", response_model=DatasetStats)
def get_dataset_statistics(
    dataset_id: int,
    current_user: Annotated[DBUser, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)]
):
    """
    Get detailed statistics and head/tail for a dataset.
    """
    try:
        db_dataset = dataset_service.get_dataset(db, dataset_id)
        if db_dataset.owner_id != current_user.id and not current_user.is_superuser:
            raise UnauthorizedAccessError("You are not authorized to view this dataset's statistics.")
        
        stats = dataset_service.get_dataset_statistics(db_dataset)
        return stats
    except ResourceNotFoundError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)
    except UnauthorizedAccessError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)
    except Exception as e:
        logger.error(f"Error getting dataset {dataset_id} statistics: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to retrieve dataset statistics.")

```