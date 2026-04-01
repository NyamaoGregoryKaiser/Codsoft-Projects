```python
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from typing import List, Optional

from backend.app.crud.base import CRUDBase
from backend.app.models.experiment import Experiment
from backend.app.schemas.experiment import ExperimentCreate, ExperimentUpdate

class CRUDExperiment(CRUDBase[Experiment, ExperimentCreate, ExperimentUpdate]):
    async def get_multi_by_model(
        self, db: AsyncSession, *, model_id: int, skip: int = 0, limit: int = 100
    ) -> List[Experiment]:
        stmt = (
            select(Experiment)
            .where(Experiment.model_id == model_id)
            .offset(skip)
            .limit(limit)
            .order_by(Experiment.id)
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def get_by_run_id(self, db: AsyncSession, *, run_id: str) -> Optional[Experiment]:
        stmt = select(Experiment).where(Experiment.run_id == run_id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

experiment = CRUDExperiment(Experiment)
```