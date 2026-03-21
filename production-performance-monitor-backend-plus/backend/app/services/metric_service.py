from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.metric import metric as crud_metric
from app.database.models import Metric, Application, User
from app.schemas.metric import MetricCreate, MetricUpdate
from app.core.exceptions import HTTPException, ForbiddenException, NotFoundException
from app.services.application_service import application_service


class MetricService:
    async def get_metric(self, db: AsyncSession, metric_id: int) -> Optional[Metric]:
        return await crud_metric.get(db, id=metric_id)

    async def get_metrics_for_application(
        self, db: AsyncSession, app_id: int, current_user: User, skip: int = 0, limit: int = 100
    ) -> List[Metric]:
        db_app = await application_service.get_application(db, app_id)
        if not db_app:
            raise NotFoundException("Application not found")
        if db_app.owner_id != current_user.id and not current_user.is_admin:
            raise ForbiddenException("You are not authorized to view metrics for this application")
        return await crud_metric.get_metrics_for_app(db, app_id=app_id, skip=skip, limit=limit)

    async def create_metric(self, db: AsyncSession, app_id: int, metric_in: MetricCreate, current_user: User) -> Metric:
        db_app = await application_service.get_application(db, app_id)
        if not db_app:
            raise NotFoundException("Application not found")
        if db_app.owner_id != current_user.id and not current_user.is_admin:
            raise ForbiddenException("You are not authorized to add metrics to this application")

        existing_metric = await crud_metric.get_by_app_and_name(db, app_id=app_id, name=metric_in.name)
        if existing_metric:
            raise HTTPException(status_code=400, detail="Metric with this name already exists for the application")

        return await crud_metric.create_metric(db, metric_in=metric_in, app_id=app_id)

    async def update_metric(self, db: AsyncSession, metric_id: int, metric_in: MetricUpdate, current_user: User) -> Metric:
        db_metric = await crud_metric.get(db, id=metric_id)
        if not db_metric:
            raise NotFoundException("Metric not found")

        db_app = await application_service.get_application(db, db_metric.app_id)
        if not db_app: # Should not happen if data integrity is maintained
            raise NotFoundException("Associated application not found")

        if db_app.owner_id != current_user.id and not current_user.is_admin:
            raise ForbiddenException("You are not authorized to update this metric")

        # Check if new name already exists for the app, if name is being updated
        if metric_in.name and metric_in.name != db_metric.name:
            existing_metric_with_new_name = await crud_metric.get_by_app_and_name(db, app_id=db_metric.app_id, name=metric_in.name)
            if existing_metric_with_new_name:
                raise HTTPException(status_code=400, detail="Another metric with this name already exists for the application")

        return await crud_metric.update_metric(db, db_metric=db_metric, metric_in=metric_in)

    async def delete_metric(self, db: AsyncSession, metric_id: int, current_user: User) -> Metric:
        db_metric = await crud_metric.get(db, id=metric_id)
        if not db_metric:
            raise NotFoundException("Metric not found")

        db_app = await application_service.get_application(db, db_metric.app_id)
        if not db_app:
            raise NotFoundException("Associated application not found")

        if db_app.owner_id != current_user.id and not current_user.is_admin:
            raise ForbiddenException("You are not authorized to delete this metric")

        await crud_metric.delete(db, id=metric_id)
        return db_metric


metric_service = MetricService()