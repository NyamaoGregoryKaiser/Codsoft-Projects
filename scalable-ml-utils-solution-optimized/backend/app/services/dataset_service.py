```python
import pandas as pd
import io
from typing import Dict, Any, List

from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import UploadFile

from backend.app.crud.crud_dataset import dataset as crud_dataset
from backend.app.schemas.dataset import DatasetCreate
from backend.app.models.dataset import Dataset
from backend.app.core.config import settings
from backend.app.core.exceptions import BadRequestException, NotFoundException, InternalServerError
from backend.app.utils.storage import storage_manager
from backend.app.core.logging_config import logger

class DatasetService:
    def __init__(self, storage=storage_manager):
        self.storage = storage

    async def upload_dataset(self, db: AsyncSession, file: UploadFile, user_id: int) -> Dataset:
        if not file.filename.endswith(".csv"):
            raise BadRequestException(detail="Only CSV files are supported.")

        file_content = await file.read()
        file_path = f"datasets/{user_id}/{file.filename}"

        try:
            df = pd.read_csv(io.StringIO(file_content.decode('utf-8')))
        except Exception as e:
            logger.error(f"Error reading CSV file {file.filename}: {e}")
            raise BadRequestException(detail=f"Could not parse CSV file: {e}")

        if df.empty:
            raise BadRequestException(detail="CSV file is empty.")

        # Infer column info (simple type inference)
        column_info = {col: str(df[col].dtype) for col in df.columns}
        row_count = len(df)

        # Generate a unique name if exists, or use original
        base_name = file.filename.replace(".csv", "")
        dataset_name = base_name
        counter = 1
        while await crud_dataset.get_by_owner(db, owner_id=user_id, name=dataset_name): # Assuming crud_dataset has get_by_owner_name
            dataset_name = f"{base_name}_{counter}"
            counter += 1

        dataset_in = DatasetCreate(
            name=dataset_name,
            description=f"Uploaded by user {user_id}",
            column_info=column_info,
            row_count=row_count
        )

        try:
            saved_path = await self.storage.save_file(file_content, file_path)
        except Exception as e:
            logger.error(f"Failed to save dataset file to storage: {e}")
            raise InternalServerError(detail="Failed to store dataset file.")

        dataset = await crud_dataset.create_with_owner(
            db, obj_in=dataset_in, owner_id=user_id, file_path=saved_path
        )
        return dataset

    async def get_dataset_df(self, db: AsyncSession, dataset_id: int, user_id: int) -> pd.DataFrame:
        dataset = await crud_dataset.get(db, id=dataset_id)
        if not dataset:
            raise NotFoundException(detail="Dataset not found.")
        if dataset.owner_id != user_id:
            raise BadRequestException(detail="Dataset not owned by user.") # Or ForbiddenException

        file_content = await self.storage.load_file(dataset.file_path)
        if not file_content:
            logger.error(f"Dataset file content not found for {dataset.file_path}")
            raise InternalServerError(detail="Dataset file content not found in storage.")

        try:
            df = pd.read_csv(io.StringIO(file_content.decode('utf-8')))
            return df
        except Exception as e:
            logger.error(f"Error reading dataset file {dataset.file_path}: {e}")
            raise InternalServerError(detail="Could not parse dataset file from storage.")

    async def get_dataset_preview(self, db: AsyncSession, dataset_id: int, user_id: int, rows: int = 5) -> Dict[str, Any]:
        df = await self.get_dataset_df(db, dataset_id, user_id)
        return {
            "columns": df.columns.tolist(),
            "data": df.head(rows).to_dict(orient="records"),
            "total_rows": len(df)
        }

    async def get_dataset(self, db: AsyncSession, dataset_id: int, user_id: int) -> Dataset:
        dataset = await crud_dataset.get(db, id=dataset_id)
        if not dataset or dataset.owner_id != user_id:
            raise NotFoundException(detail="Dataset not found or not owned by user.")
        return dataset

    async def delete_dataset(self, db: AsyncSession, dataset_id: int, user_id: int) -> Dataset:
        dataset = await crud_dataset.get(db, id=dataset_id)
        if not dataset or dataset.owner_id != user_id:
            raise NotFoundException(detail="Dataset not found or not owned by user.")

        # Delete the file from storage
        try:
            await self.storage.delete_file(dataset.file_path)
            # Also attempt to remove the user's dataset directory if empty
            user_dir = f"datasets/{user_id}/"
            await self.storage.delete_directory(user_dir)
        except Exception as e:
            logger.warning(f"Failed to delete dataset file {dataset.file_path} from storage: {e}")
            # Do not re-raise, proceed with DB deletion as file might be gone already or can be cleaned up later

        # Delete from database
        deleted_dataset = await crud_dataset.remove(db, id=dataset_id)
        if not deleted_dataset:
            raise InternalServerError(detail="Failed to delete dataset from database.")
        return deleted_dataset

dataset_service = DatasetService()
```