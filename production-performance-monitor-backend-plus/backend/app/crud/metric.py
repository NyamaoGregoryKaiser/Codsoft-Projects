from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.crud.base import CRUDBase
from app.database.models import Metric
from app.schemas.metric import MetricCreate, MetricUpdate


class CRUDMetric(CRUDBase[Metric]):
    async def get_by_app_and_name(self, db: AsyncSession, app_id: int, name: str) -> Optional[Metric]:
        """Retrieve a metric by its application ID and name."""
        stmt = select(self.model).where(self.model.app_id == app_id, self.model.name == name)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_metrics_for_app(self, db: AsyncSession, app_id: int, skip: int = 0, limit: int = 100) -> List[Metric]:
        """Retrieve all metrics for a given application."""
        stmt = select(self.model).where(self.model.app_id == app_id).offset(skip).limit(limit)
        result = await db.execute(stmt)
        return result.scalars().all()

    async def create_metric(self, db: AsyncSession, metric_in: MetricCreate, app_id: int) -> Metric:
        """Create a new metric for a specific application."""
        db_metric = self.model(
            app_id=app_id,
            name=metric_in.name,
            unit=metric_in.unit,
            metric_type=metric_in.metric_type,
            threshold_warning=metric_in.threshold_warning,
            threshold_critical=metric_in.threshold_critical,
        )
        db.add(db_metric)
        await db.commit()
        await db.refresh(db_metric)
        return db_metric

    async def update_metric(self, db: AsyncSession, db_metric: Metric, metric_in: MetricUpdate) -> Metric:
        """Update an existing metric."""
        update_data = metric_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_metric, field, value)

        await db.commit()
        await db.refresh(db_metric)
        return db_metric


metric = CRUDMetric(Metric)