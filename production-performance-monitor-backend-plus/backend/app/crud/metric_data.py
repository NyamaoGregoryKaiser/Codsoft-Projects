from datetime import datetime, timedelta
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, text
from sqlalchemy.dialects import postgresql

from app.crud.base import CRUDBase
from app.database.models import MetricData
from app.schemas.metric_data import MetricDataPointCreate, MetricDataPointResponse, MetricDataAggregation


class CRUDMetricData(CRUDBase[MetricData]):
    async def create_metric_data_point(self, db: AsyncSession, metric_id: int, data_point_in: MetricDataPointCreate) -> MetricData:
        """Create a single metric data point."""
        timestamp = data_point_in.timestamp if data_point_in.timestamp else datetime.utcnow()
        db_metric_data = self.model(
            metric_id=metric_id,
            value=data_point_in.value,
            timestamp=timestamp,
        )
        db.add(db_metric_data)
        await db.commit()
        await db.refresh(db_metric_data)
        return db_metric_data

    async def create_metric_data_batch(self, db: AsyncSession, metric_id: int, data_points_in: List[MetricDataPointCreate]) -> List[MetricData]:
        """Create multiple metric data points in a batch."""
        db_metric_data_points = []
        for dp_in in data_points_in:
            timestamp = dp_in.timestamp if dp_in.timestamp else datetime.utcnow()
            db_metric_data_points.append(
                self.model(metric_id=metric_id, value=dp_in.value, timestamp=timestamp)
            )
        db.add_all(db_metric_data_points)
        await db.commit()
        # Refreshing all might be too slow for large batches, consider not refreshing or refreshing selectively
        for dp in db_metric_data_points:
            await db.refresh(dp)
        return db_metric_data_points

    async def get_metric_data_points(
        self,
        db: AsyncSession,
        metric_id: int,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        limit: int = 1000,
        offset: int = 0,
        order_desc: bool = True
    ) -> List[MetricData]:
        """
        Retrieve raw metric data points for a given metric within a time range.
        """
        stmt = select(self.model).where(self.model.metric_id == metric_id)

        if start_time:
            stmt = stmt.where(self.model.timestamp >= start_time)
        if end_time:
            stmt = stmt.where(self.model.timestamp <= end_time)

        if order_desc:
            stmt = stmt.order_by(self.model.timestamp.desc())
        else:
            stmt = stmt.order_by(self.model.timestamp.asc())

        stmt = stmt.offset(offset).limit(limit)

        result = await db.execute(stmt)
        return result.scalars().all()

    async def get_aggregated_metric_data(
        self,
        db: AsyncSession,
        metric_id: int,
        start_time: datetime,
        end_time: datetime,
        interval: timedelta = timedelta(minutes=5),
    ) -> List[MetricDataAggregation]:
        """
        Retrieve aggregated metric data (avg, min, max) for a given metric
        within a time range, grouped by specified interval.
        """
        # PostgreSQL specific way to group by time interval
        # Uses date_trunc and generate_series for robust interval grouping,
        # ensuring all intervals are present even if no data exists.
        interval_str = f"{int(interval.total_seconds())} seconds"

        stmt = (
            select(
                func.date_trunc(
                    'second',
                    func.generate_series(start_time, end_time, text(f"'{interval_str}'::interval"))
                ).label("timestamp"),
                func.avg(self.model.value).label("average"),
                func.min(self.model.value).label("min"),
                func.max(self.model.value).label("max"),
                func.count(self.model.value).label("count"),
                func.sum(self.model.value).label("sum"),
            )
            .outerjoin(
                self.model,
                and_(
                    self.model.metric_id == metric_id,
                    self.model.timestamp >= func.date_trunc('second', text("generate_series.generate_series")),
                    self.model.timestamp < (func.date_trunc('second', text("generate_series.generate_series")) + text(f"'{interval_str}'::interval"))
                )
            )
            .group_by(text("timestamp"))
            .order_by(text("timestamp"))
        )
        
        # Manually constructing the query to handle generate_series correctly
        # This requires `func.date_trunc` and `text` for `generate_series` and interval
        # A more complex raw SQL query might be better for extremely optimized time-series
        # This approach ensures SQLAlchemy's ORM is still partially used for safety.

        # Building the query manually for PostgreSQL date_trunc and generate_series
        # This can be complex with SQLAlchemy's ORM directly for `generate_series`.
        # For simplicity and robust aggregation, we might use a raw SQL approach or a subquery.

        # Let's simplify for demonstration, assuming `date_trunc` and `group by` is enough
        # The above generate_series approach is more complete for filling gaps.
        # For a first pass, let's do a simpler aggregate.
        
        # A simpler aggregation without `generate_series` which might miss empty intervals
        interval_func = func.date_trunc('minute', self.model.timestamp) # Example for minute-level aggregation
        if interval <= timedelta(minutes=1):
            interval_func = func.date_trunc('second', self.model.timestamp)
        elif interval <= timedelta(hours=1):
            interval_func = func.date_trunc('minute', self.model.timestamp)
        elif interval <= timedelta(days=1):
            interval_func = func.date_trunc('hour', self.model.timestamp)
        else:
            interval_func = func.date_trunc('day', self.model.timestamp)

        stmt = (
            select(
                interval_func.label("timestamp"),
                func.avg(self.model.value).label("average"),
                func.min(self.model.value).label("min"),
                func.max(self.model.value).label("max"),
                func.count(self.model.value).label("count"),
                func.sum(self.model.value).label("sum"),
            )
            .where(
                self.model.metric_id == metric_id,
                self.model.timestamp >= start_time,
                self.model.timestamp <= end_time,
            )
            .group_by(text("timestamp"))
            .order_by(text("timestamp"))
        )


        result = await db.execute(stmt)
        # Map results to Pydantic schema
        return [
            MetricDataAggregation(
                timestamp=row.timestamp,
                average=row.average,
                min=row.min,
                max=row.max,
                count=row.count,
                sum=row.sum,
            )
            for row in result
        ]


metric_data = CRUDMetricData(MetricData)