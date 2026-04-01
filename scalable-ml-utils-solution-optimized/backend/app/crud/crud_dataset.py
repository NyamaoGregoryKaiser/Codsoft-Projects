```python
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from typing import List, Optional

from backend.app.crud.base import CRUDBase
from backend.app.models.dataset import Dataset
from backend.app.schemas.dataset import DatasetCreate, DatasetUpdate

class CRUDDataset(CRUDBase[Dataset, DatasetCreate, DatasetUpdate]):
    async def get_multi_by_owner(
        self, db: AsyncSession, *, owner_id: int, skip: int = 0, limit: int = 100
    ) -> List[Dataset]:
        stmt = (
            select(Dataset)
            .where(Dataset.owner_id == owner_id)
            .offset(skip)
            .limit(limit)
            .order_by(Dataset.id)
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def create_with_owner(
        self, db: AsyncSession, *, obj_in: DatasetCreate, owner_id: int, file_path: str
    ) -> Dataset:
        db_obj = self.model(
            name=obj_in.name,
            description=obj_in.description,
            file_path=file_path,
            column_info=obj_in.column_info,
            row_count=obj_in.row_count,
            owner_id=owner_id,
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

dataset = CRUDDataset(Dataset)
```