```python
import os
import pandas as pd
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from fastapi import UploadFile, HTTPException, status
from loguru import logger
from datetime import datetime, UTC

from backend.models import Dataset as DBDataset, User as DBUser
from backend.schemas.dataset import DatasetCreate, DatasetUpdate, Dataset, DatasetStats, DatasetColumn
from backend.core.config import settings
from backend.core.exception_handlers import ResourceNotFoundError, UnauthorizedAccessError
from backend.services.cache_service import cache_service

DATASET_CACHE_TTL = 3600 # 1 hour

class DatasetService:
    def _generate_file_path(self, owner_id: int, original_filename: str) -> str:
        filename, file_extension = os.path.splitext(original_filename)
        timestamp = datetime.now(UTC).strftime("%Y%m%d%H%M%S")
        safe_filename = "".join(c if c.isalnum() else "_" for c in filename)
        new_filename = f"{safe_filename}_{owner_id}_{timestamp}{file_extension}"
        return os.path.join(settings.UPLOAD_DIRECTORY, new_filename)

    async def create_dataset(self, db: Session, user: DBUser, dataset_data: DatasetCreate, file: UploadFile) -> DBDataset:
        if not file.filename.lower().endswith(('.csv', '.parquet')):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only CSV or Parquet files are supported.")

        file_path = self._generate_file_path(user.id, file.filename)
        try:
            with open(file_path, "wb") as buffer:
                while contents := await file.read(1024 * 1024): # Read in 1MB chunks
                    buffer.write(contents)
            logger.info(f"File uploaded to {file_path}")

            df = self._read_dataframe(file_path)
            row_count, col_count = df.shape
            file_size_bytes = os.path.getsize(file_path)

            db_dataset = DBDataset(
                name=dataset_data.name,
                description=dataset_data.description,
                owner_id=user.id,
                file_path=file_path,
                file_size_bytes=file_size_bytes,
                row_count=row_count,
                column_count=col_count,
                created_at=datetime.now(UTC),
                updated_at=datetime.now(UTC)
            )
            db.add(db_dataset)
            db.commit()
            db.refresh(db_dataset)
            logger.info(f"Dataset {db_dataset.id} created by user {user.id}")
            return db_dataset
        except Exception as e:
            logger.error(f"Error creating dataset: {e}")
            if os.path.exists(file_path):
                os.remove(file_path)
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to process dataset file: {e}")

    def get_dataset(self, db: Session, dataset_id: int) -> DBDataset:
        db_dataset = db.query(DBDataset).filter(DBDataset.id == dataset_id).first()
        if not db_dataset:
            raise ResourceNotFoundError(f"Dataset with ID {dataset_id} not found.")
        return db_dataset

    def get_all_datasets(self, db: Session, user: DBUser) -> List[DBDataset]:
        return db.query(DBDataset).filter(DBDataset.owner_id == user.id).all()

    def update_dataset(self, db: Session, user: DBUser, dataset_id: int, dataset_update: DatasetUpdate) -> DBDataset:
        db_dataset = self.get_dataset(db, dataset_id)
        if db_dataset.owner_id != user.id and not user.is_superuser:
            raise UnauthorizedAccessError("You are not authorized to update this dataset.")

        update_data = dataset_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_dataset, key, value)
        db_dataset.updated_at = datetime.now(UTC)
        db.add(db_dataset)
        db.commit()
        db.refresh(db_dataset)
        logger.info(f"Dataset {db_dataset.id} updated by user {user.id}")
        return db_dataset

    def delete_dataset(self, db: Session, user: DBUser, dataset_id: int):
        db_dataset = self.get_dataset(db, dataset_id)
        if db_dataset.owner_id != user.id and not user.is_superuser:
            raise UnauthorizedAccessError("You are not authorized to delete this dataset.")

        # Delete the associated file
        if os.path.exists(db_dataset.file_path):
            os.remove(db_dataset.file_path)
            logger.info(f"File {db_dataset.file_path} deleted.")

        # Invalidate cache entries related to this dataset
        cache_service.delete(f"dataset_df_{dataset_id}")
        cache_service.delete(f"dataset_stats_{dataset_id}")

        db.delete(db_dataset)
        db.commit()
        logger.info(f"Dataset {db_dataset.id} deleted by user {user.id}")

    def get_dataset_dataframe(self, dataset: DBDataset) -> pd.DataFrame:
        cache_key = f"dataset_df_{dataset.id}"
        df = cache_service.get(cache_key)
        if df is not None:
            logger.debug(f"Loaded DataFrame for dataset {dataset.id} from cache.")
            return df

        df = self._read_dataframe(dataset.file_path)
        cache_service.set(cache_key, df, ex=DATASET_CACHE_TTL)
        logger.debug(f"Loaded DataFrame for dataset {dataset.id} from file and cached.")
        return df

    def get_dataset_statistics(self, dataset: DBDataset) -> DatasetStats:
        cache_key = f"dataset_stats_{dataset.id}"
        stats = cache_service.get(cache_key)
        if stats is not None:
            logger.debug(f"Loaded statistics for dataset {dataset.id} from cache.")
            return stats

        df = self.get_dataset_dataframe(dataset)
        columns_stats: List[DatasetColumn] = []

        numerical_cols = df.select_dtypes(include=['number']).columns
        categorical_cols = df.select_dtypes(include=['object', 'category', 'bool']).columns

        numerical_summary = df[numerical_cols].describe().to_dict() if not numerical_cols.empty else {}
        categorical_summary = df[categorical_cols].describe(include='all').to_dict() if not categorical_cols.empty else {}

        for col in df.columns:
            col_data: Dict[str, Any] = {
                "name": col,
                "dtype": str(df[col].dtype),
                "unique_values": df[col].nunique(),
                "missing_values": df[col].isnull().sum(),
            }
            if col in numerical_cols:
                col_data["mean"] = df[col].mean()
                col_data["median"] = df[col].median()
                col_data["std"] = df[col].std()
                col_data["min"] = df[col].min()
                col_data["max"] = df[col].max()
            elif col in categorical_cols:
                col_data["value_counts"] = df[col].value_counts().head(10).to_dict() # Limit top 10 for brevity

            columns_stats.append(DatasetColumn(**col_data))

        dataset_stats = DatasetStats(
            columns=columns_stats,
            numerical_summary=numerical_summary,
            categorical_summary=categorical_summary,
            head=df.head().to_dict(orient='records'),
            tail=df.tail().to_dict(orient='records')
        )
        cache_service.set(cache_key, dataset_stats, ex=DATASET_CACHE_TTL)
        logger.debug(f"Generated statistics for dataset {dataset.id} and cached.")
        return dataset_stats

    def _read_dataframe(self, file_path: str) -> pd.DataFrame:
        if file_path.lower().endswith('.csv'):
            return pd.read_csv(file_path)
        elif file_path.lower().endswith('.parquet'):
            return pd.read_parquet(file_path)
        else:
            raise ValueError("Unsupported file format. Only CSV and Parquet are supported.")
```