```python
from typing import Any, List
from fastapi import APIRouter, Depends, UploadFile, File, Form, status
from sqlalchemy.ext.asyncio import AsyncSession
import json

from backend.app.auth.auth_bearer import get_current_active_user
from backend.app.crud.crud_dataset import dataset as crud_dataset
from backend.app.db.session import get_db
from backend.app.models.user import User
from backend.app.schemas.dataset import Dataset, DatasetCreate, DatasetUpdate, DatasetColumnSelection
from backend.app.services.dataset_service import dataset_service
from backend.app.core.exceptions import NotFoundException, BadRequestException, InternalServerError
from backend.app.core.logging_config import logger

router = APIRouter()

@router.post("/", response_model=Dataset, status_code=status.HTTP_201_CREATED)
async def upload_dataset(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    file: UploadFile = File(...),
) -> Any:
    """
    Upload a new dataset (CSV file).
    """
    if not file.filename:
        raise BadRequestException(detail="No file selected for upload.")

    dataset = await dataset_service.upload_dataset(db, file, current_user.id)
    logger.info(f"User {current_user.email} uploaded dataset {dataset.name} (ID: {dataset.id}).")
    return dataset

@router.get("/", response_model=List[Dataset])
async def read_datasets(
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Retrieve current user's datasets.
    """
    datasets = await crud_dataset.get_multi_by_owner(db, owner_id=current_user.id, skip=skip, limit=limit)
    return datasets

@router.get("/{dataset_id}", response_model=Dataset)
async def read_dataset(
    dataset_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get a specific dataset by ID.
    """
    dataset = await dataset_service.get_dataset(db, dataset_id, current_user.id)
    return dataset

@router.get("/{dataset_id}/preview", response_model=dict)
async def get_dataset_preview(
    dataset_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    rows: int = 5
) -> Any:
    """
    Get a preview of the dataset's data.
    """
    preview = await dataset_service.get_dataset_preview(db, dataset_id, current_user.id, rows)
    return preview

@router.put("/{dataset_id}", response_model=Dataset)
async def update_dataset(
    dataset_id: int,
    dataset_in: DatasetUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Update a dataset's metadata.
    """
    dataset = await crud_dataset.get(db, id=dataset_id)
    if not dataset or dataset.owner_id != current_user.id:
        raise NotFoundException(detail="Dataset not found or not owned by user.")

    updated_dataset = await crud_dataset.update(db, db_obj=dataset, obj_in=dataset_in)
    logger.info(f"User {current_user.email} updated dataset {updated_dataset.name} (ID: {updated_dataset.id}).")
    return updated_dataset

@router.delete("/{dataset_id}", response_model=Dataset)
async def delete_dataset(
    dataset_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Delete a dataset.
    """
    deleted_dataset = await dataset_service.delete_dataset(db, dataset_id, current_user.id)
    logger.info(f"User {current_user.email} deleted dataset {deleted_dataset.name} (ID: {deleted_dataset.id}).")
    return deleted_dataset
```