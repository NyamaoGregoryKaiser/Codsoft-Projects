from typing import Annotated, List

from fastapi import APIRouter, Depends, status, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
import pandas as pd
import io

from app.schemas.dataset import Dataset, DatasetCreate, DatasetUpdate
from app.models.user import User
from app.dependencies.database import get_db
from app.dependencies.auth import get_current_active_user
from app.services.dataset_service import dataset_service
from app.core.exceptions import HTTPException
from app.utils.logger import get_logger

logger = get_logger()
router = APIRouter(prefix="/datasets", tags=["Datasets"])

@router.post("/", response_model=Dataset, status_code=status.HTTP_201_CREATED)
async def create_new_dataset(
    dataset_in: DatasetCreate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """
    Create a new dataset definition.
    """
    dataset = await dataset_service.create_dataset(db, dataset_in, current_user.id)
    logger.info(f"User {current_user.email} created dataset: {dataset.name} (ID: {dataset.id})")
    return dataset

@router.get("/", response_model=List[Dataset])
async def read_datasets(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    skip: int = 0,
    limit: int = 100
):
    """
    Retrieve all datasets for the current user.
    """
    datasets = await dataset_service.get_datasets_by_owner(db, current_user.id, skip=skip, limit=limit)
    return datasets

@router.get("/{dataset_id}", response_model=Dataset)
async def read_dataset(
    dataset_id: int,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """
    Retrieve a specific dataset by ID.
    """
    dataset = await dataset_service.get_dataset(db, dataset_id, current_user.id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found or unauthorized")
    return dataset

@router.put("/{dataset_id}", response_model=Dataset)
async def update_existing_dataset(
    dataset_id: int,
    dataset_in: DatasetUpdate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """
    Update an existing dataset definition.
    """
    dataset = await dataset_service.update_dataset(db, dataset_id, dataset_in, current_user.id)
    logger.info(f"User {current_user.email} updated dataset: {dataset.name} (ID: {dataset.id})")
    return dataset

@router.delete("/{dataset_id}", response_model=Dataset)
async def delete_existing_dataset(
    dataset_id: int,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """
    Delete an existing dataset definition.
    """
    dataset = await dataset_service.delete_dataset(db, dataset_id, current_user.id)
    logger.info(f"User {current_user.email} deleted dataset ID: {dataset.id}")
    return dataset

@router.get("/{dataset_id}/data", response_model=List[dict])
async def get_dataset_preview_data(
    dataset_id: int,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    limit: int = 100
):
    """
    Retrieve a preview of the data for a given dataset.
    (Note: This is a placeholder for actual data retrieval from external sources)
    """
    data = await dataset_service.get_dataset_data(db, dataset_id, current_user.id, limit=limit)
    return data

@router.post("/upload/csv", response_model=Dataset, status_code=status.HTTP_201_CREATED)
async def upload_csv_dataset(
    file: UploadFile = File(...),
    name: str = "Uploaded CSV",
    description: str = None,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """
    Upload a CSV file to create a new dataset.
    (For demonstration: content stored directly in source_config JSON,
    in real-world, save to S3/blob storage and store path.)
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed.")

    content = await file.read()
    try:
        # Attempt to read a small part to validate CSV structure
        df_preview = pd.read_csv(io.StringIO(content.decode('utf-8')), nrows=5)
        # Store metadata and potentially a pointer to storage
        # For simplicity, we'll store a truncated content (first few lines) or just metadata.
        # In a real app, you'd save `content` to S3 or a local file path.
        # Here, let's just create the definition.
        
        # A real implementation would upload `content` to object storage (e.g., S3)
        # and store the S3 URL in `source_config`.
        
        # For this example, let's keep source_config minimal
        source_config = {
            "filename": file.filename,
            "columns": df_preview.columns.tolist(),
            "first_rows_preview": df_preview.head(5).to_dict(orient='records') # Small preview
        }

        dataset_in = DatasetCreate(
            name=name or file.filename,
            description=description or f"Uploaded CSV: {file.filename}",
            source_type="csv",
            source_config=source_config
        )
        dataset = await dataset_service.create_dataset(db, dataset_in, current_user.id)
        logger.info(f"User {current_user.email} uploaded CSV dataset: {dataset.name} (ID: {dataset.id})")
        return dataset
    except Exception as e:
        logger.error(f"Error processing CSV upload: {e}")
        raise HTTPException(status_code=422, detail=f"Could not process CSV file: {e}")