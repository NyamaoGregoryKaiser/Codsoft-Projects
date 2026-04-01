```python
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from typing import List, Optional

from backend.app.crud.base import CRUDBase
from backend.app.models.model import Model
from backend.app.schemas.model import ModelCreate, ModelUpdate

class CRUDModel(CRUDBase[Model, ModelCreate, ModelUpdate]):
    async def get_multi_by_owner(
        self, db: AsyncSession, *, owner_id: int, skip: int = 0, limit: int = 100
    ) -> List[Model]:
        stmt = (
            select(Model)
            .where(Model.owner_id == owner_id)
            .offset(skip)
            .limit(limit)
            .order_by(Model.id)
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def create_with_owner(
        self,
        db: AsyncSession,
        *,
        obj_in: ModelCreate,
        owner_id: int,
        artifact_path: str
    ) -> Model:
        db_obj = self.model(
            name=obj_in.name,
            description=obj_in.description,
            model_type=obj_in.model_type,
            artifact_path=artifact_path,
            target_column=obj_in.target_column,
            features=obj_in.features,
            owner_id=owner_id,
            dataset_id=obj_in.dataset_id,
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

model = CRUDModel(Model)
```