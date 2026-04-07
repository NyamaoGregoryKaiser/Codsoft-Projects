import random
from datetime import datetime, timedelta, timezone
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import crud
from app.db.models import Metric, Database
from app.schemas.metric import MetricCreate, MetricUpdate
from app.core.exceptions import NotFoundException, ForbiddenException, UnprocessableEntityException
from loguru import logger

class MetricService:
    async def get_metric(self, db: AsyncSession, metric_id: int) -> Metric:
        metric = await crud.metric.get(db, metric_id)
        if not metric:
            raise NotFoundException(f"Metric with ID {metric_id} not found")
        return metric

    async def get_database_metrics(self, db: AsyncSession, database_id: int, current_user_id: int, skip: int = 0, limit: int = 100) -> List[Metric]:
        db_instance = await crud.database.get(db, database_id)
        if not db_instance:
            raise NotFoundException(f"Database with ID {database_id} not found.")
        if db_instance.owner_id != current_user_id:
             raise ForbiddenException("You do not have permission to view metrics for this database.")
        
        return await crud.metric.get_multi_by_database(db, database_id=database_id, skip=skip, limit=limit)

    async def create_metric(self, db: AsyncSession, metric_in: MetricCreate, current_user_id: int) -> Metric:
        db_instance = await crud.database.get(db, metric_in.database_id)
        if not db_instance:
            raise NotFoundException(f"Database with ID {metric_in.database_id} not found.")
        if db_instance.owner_id != current_user_id:
             raise ForbiddenException("You do not have permission to add metrics to this database.")

        # Set timestamp if not provided
        if metric_in.timestamp is None:
            metric_in.timestamp = datetime.now(timezone.utc)
            
        new_metric = await crud.metric.create(db, metric_in)
        logger.info(f"User '{current_user_id}' added metric (ID: {new_metric.id}) for database ID: {new_metric.database_id}")
        return new_metric

    async def update_metric(self, db: AsyncSession, metric_id: int, metric_in: MetricUpdate, current_user_id: int) -> Metric:
        db_metric = await self.get_metric(db, metric_id)
        
        # Check ownership of the metric's database
        db_instance = await crud.database.get(db, db_metric.database_id)
        if not db_instance or db_instance.owner_id != current_user_id:
             raise ForbiddenException("You do not have permission to update this metric.")

        updated_metric = await crud.metric.update(db, db_metric, metric_in)
        logger.info(f"User '{current_user_id}' updated metric (ID: {updated_metric.id}) for database ID: {updated_metric.database_id}")
        return updated_metric

    async def delete_metric(self, db: AsyncSession, metric_id: int, current_user_id: int) -> Metric:
        db_metric = await self.get_metric(db, metric_id)

        # Check ownership of the metric's database
        db_instance = await crud.database.get(db, db_metric.database_id)
        if not db_instance or db_instance.owner_id != current_user_id:
             raise ForbiddenException("You do not have permission to delete this metric.")

        deleted_metric = await crud.metric.remove(db, metric_id)
        logger.info(f"User '{current_user_id}' deleted metric (ID: {deleted_metric.id}) for database ID: {deleted_metric.database_id}")
        return deleted_metric

    async def generate_simulated_metrics(self, db: AsyncSession, database_id: int, current_user_id: int, num_metrics: int = 10):
        db_instance = await crud.database.get(db, database_id)
        if not db_instance:
            raise NotFoundException(f"Database with ID {database_id} not found.")
        if db_instance.owner_id != current_user_id:
             raise ForbiddenException("You do not have permission to generate metrics for this database.")

        metrics_created = []
        for i in range(num_metrics):
            timestamp = datetime.now(timezone.utc) - timedelta(minutes=i*5) # Metrics every 5 minutes
            metric_data = MetricCreate(
                database_id=database_id,
                timestamp=timestamp,
                cpu_usage_percent=round(random.uniform(10.0, 90.0), 2),
                memory_usage_percent=round(random.uniform(20.0, 95.0), 2),
                disk_io_ops_sec=round(random.uniform(50.0, 1000.0), 2),
                active_connections=random.randint(5, 500),
                total_queries_sec=round(random.uniform(100.0, 5000.0), 2),
                avg_query_latency_ms=round(random.uniform(1.0, 500.0), 2),
                slow_queries_json={
                    "count": random.randint(0, 10),
                    "examples": [f"SELECT * FROM large_table WHERE column = '{random.randint(1,100)}' -- duration: {random.randint(100,2000)}ms"] if random.random() > 0.5 else []
                }
            )
            metric = await crud.metric.create(db, metric_data)
            metrics_created.append(metric)
        logger.info(f"Generated {num_metrics} simulated metrics for database ID: {database_id}")
        return metrics_created


metric_service = MetricService()