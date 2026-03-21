from datetime import datetime, timedelta
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as redis
from json import dumps, loads

from app.crud.metric_data import metric_data as crud_metric_data
from app.crud.metric import metric as crud_metric
from app.crud.application import application as crud_application
from app.database.models import Metric, Application
from app.schemas.metric_data import MetricDataPointCreate, MetricDataBatchCreate, MetricDataPointResponse, MetricDataAggregation
from app.core.exceptions import HTTPException, NotFoundException, ForbiddenException
from app.core.config import settings


class MetricDataService:
    def __init__(self):
        self.redis_client = redis.from_url(settings.REDIS_URL, encoding="utf-8", decode_responses=True)

    async def _get_metric_by_app_key_and_name(self, db: AsyncSession, api_key: str, metric_name: str) -> Optional[Metric]:
        app = await crud_application.get_by_api_key(db, api_key=api_key)
        if not app:
            raise NotFoundException("Application not found for the given API key")
        metric = await crud_metric.get_by_app_and_name(db, app_id=app.id, name=metric_name)
        if not metric:
            raise NotFoundException(f"Metric '{metric_name}' not found for application '{app.name}'")
        return metric

    async def ingest_metric_data_batch(self, db: AsyncSession, batch_in: MetricDataBatchCreate):
        """
        Ingests a batch of metric data points from an external application.
        This method will find or create metrics if they don't exist based on the data points.
        """
        app = await crud_application.get_by_api_key(db, api_key=batch_in.api_key)
        if not app:
            raise NotFoundException("Application not found for the given API key")

        processed_data_points = []
        for dp_in in batch_in.data_points:
            metric = await crud_metric.get_by_app_and_name(db, app_id=app.id, name=dp_in.name)
            if not metric:
                # Optionally auto-create metric if not found.
                # For a production system, you might want to require explicit metric creation.
                # Here, we'll auto-create with default settings (GAUGE).
                new_metric_create = MetricDataPointCreate(name=dp_in.name, value=dp_in.value) # Only name and value are used
                metric = await crud_metric.create_metric(db, new_metric_create, app_id=app.id)

            await crud_metric_data.create_metric_data_point(db, metric_id=metric.id, data_point_in=dp_in)
            processed_data_points.append(dp_in)
        
        # Invalidate cache for affected metrics
        for dp_in in batch_in.data_points:
            metric = await crud_metric.get_by_app_and_name(db, app_id=app.id, name=dp_in.name)
            if metric:
                 await self.redis_client.delete(f"latest_metric_data:{metric.id}")
                 await self.redis_client.delete(f"metric_data_overview:{metric.id}")


        return {"status": "success", "message": f"{len(processed_data_points)} data points ingested."}

    async def get_metric_data_for_display(
        self,
        db: AsyncSession,
        metric_id: int,
        start_time: datetime,
        end_time: datetime,
        interval: timedelta = timedelta(minutes=5),
        current_user_id: int = None, # For authorization check
        is_admin: bool = False # For authorization check
    ) -> List[MetricDataAggregation]:
        """
        Retrieves aggregated metric data for display in charts, with authorization.
        """
        db_metric = await crud_metric.get(db, id=metric_id)
        if not db_metric:
            raise NotFoundException("Metric not found")

        db_app = await crud_application.get(db, id=db_metric.app_id)
        if not db_app:
            raise NotFoundException("Associated application not found") # Should not happen

        if db_app.owner_id != current_user_id and not is_admin:
            raise ForbiddenException("You are not authorized to view data for this metric.")

        # Cache key for aggregated data
        cache_key = f"metric_data_agg:{metric_id}:{start_time.isoformat()}:{end_time.isoformat()}:{int(interval.total_seconds())}"
        cached_data = await self.redis_client.get(cache_key)

        if cached_data:
            return [MetricDataAggregation(**item) for item in loads(cached_data)]

        # If not in cache, fetch from DB
        aggregated_data = await crud_metric_data.get_aggregated_metric_data(
            db, metric_id=metric_id, start_time=start_time, end_time=end_time, interval=interval
        )

        # Cache the result for a short period (e.g., 5 minutes)
        await self.redis_client.setex(cache_key, 300, dumps([item.model_dump_json() for item in aggregated_data])) # Store as JSON string list

        return aggregated_data
    
    async def get_latest_metric_data_point(
        self,
        db: AsyncSession,
        metric_id: int,
        current_user_id: int = None,
        is_admin: bool = False
    ) -> Optional[MetricDataPointResponse]:
        """
        Retrieves the single latest data point for a metric, with authorization and caching.
        """
        db_metric = await crud_metric.get(db, id=metric_id)
        if not db_metric:
            raise NotFoundException("Metric not found")

        db_app = await crud_application.get(db, id=db_metric.app_id)
        if not db_app:
            raise NotFoundException("Associated application not found")

        if db_app.owner_id != current_user_id and not is_admin:
            raise ForbiddenException("You are not authorized to view data for this metric.")
        
        cache_key = f"latest_metric_data:{metric_id}"
        cached_data = await self.redis_client.get(cache_key)

        if cached_data:
            return MetricDataPointResponse(**loads(cached_data))
        
        latest_data = await crud_metric_data.get_metric_data_points(db, metric_id=metric_id, limit=1, order_desc=True)
        if latest_data:
            data_point = latest_data[0]
            response = MetricDataPointResponse(
                id=data_point.id,
                metric_id=data_point.metric_id,
                value=data_point.value,
                timestamp=data_point.timestamp,
                created_at=data_point.created_at, # BaseSchema fields
                updated_at=data_point.updated_at
            )
            await self.redis_client.setex(cache_key, 60, response.model_dump_json()) # Cache for 60 seconds
            return response
        return None

metric_data_service = MetricDataService()