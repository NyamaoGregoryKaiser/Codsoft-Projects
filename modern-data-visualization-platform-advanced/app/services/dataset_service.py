from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
import pandas as pd
import io

from app.crud.dataset import dataset as crud_dataset
from app.models.dataset import Dataset
from app.schemas.dataset import DatasetCreate, DatasetUpdate
from app.core.exceptions import HTTPException

class DatasetService:
    async def create_dataset(self, db: AsyncSession, obj_in: DatasetCreate, owner_id: int) -> Dataset:
        # Here we could add logic to validate source_config based on source_type
        # e.g., if source_type is 'csv', check if 'file_path' is present
        return await crud_dataset.create(db, obj_in=obj_in, owner_id=owner_id)

    async def get_dataset(self, db: AsyncSession, dataset_id: int, owner_id: int) -> Optional[Dataset]:
        db_dataset = await crud_dataset.get(db, dataset_id)
        if not db_dataset or db_dataset.owner_id != owner_id:
            raise HTTPException(status_code=404, detail="Dataset not found or unauthorized")
        return db_dataset

    async def get_datasets_by_owner(self, db: AsyncSession, owner_id: int, skip: int = 0, limit: int = 100) -> List[Dataset]:
        return await crud_dataset.get_multi_by_owner(db, owner_id=owner_id, skip=skip, limit=limit)

    async def update_dataset(self, db: AsyncSession, dataset_id: int, obj_in: DatasetUpdate, owner_id: int) -> Dataset:
        db_dataset = await self.get_dataset(db, dataset_id, owner_id) # Ensures ownership check
        return await crud_dataset.update(db, db_obj=db_dataset, obj_in=obj_in)

    async def delete_dataset(self, db: AsyncSession, dataset_id: int, owner_id: int) -> Dataset:
        db_dataset = await self.get_dataset(db, dataset_id, owner_id) # Ensures ownership check
        deleted_dataset = await crud_dataset.delete(db, id=dataset_id)
        if not deleted_dataset:
            raise HTTPException(status_code=404, detail="Dataset not found")
        return deleted_dataset

    async def get_dataset_data(self, db: AsyncSession, dataset_id: int, owner_id: int, limit: int = 100) -> List[dict]:
        """
        Retrieves data for a given dataset.
        This is a placeholder; actual implementation would depend on source_type and source_config.
        """
        db_dataset = await self.get_dataset(db, dataset_id, owner_id)
        
        # --- Placeholder for actual data retrieval ---
        # In a real system, this would connect to various data sources
        # based on db_dataset.source_type and db_dataset.source_config.
        
        mock_data = []
        if db_dataset.source_type == "csv":
            # Assume source_config has {"file_path": "path/to/csv"} or {"content": "base64_encoded_csv_string"}
            # For demonstration, let's just return some dummy data.
            # In production, you'd load from storage (S3, local disk, etc.)
            df = pd.DataFrame({
                "category": [f"A{i}" for i in range(1, limit + 1)],
                "value": [i * 10 for i in range(1, limit + 1)],
                "date": pd.to_datetime([f"2023-01-{i:02d}" for i in range(1, limit + 1)])
            })
            mock_data = df.head(limit).to_dict(orient="records")
        elif db_dataset.source_type == "sql_query":
            # Assume source_config has {"query": "SELECT * FROM my_table"}
            # This would execute the query against a connected database (not the app's main DB)
            mock_data = [{"id": i, "name": f"Item {i}", "quantity": i*5} for i in range(1, limit + 1)]
        else:
            mock_data = [{"message": f"Data retrieval not implemented for {db_dataset.source_type}"}]
        # --- End Placeholder ---

        return mock_data


dataset_service = DatasetService()