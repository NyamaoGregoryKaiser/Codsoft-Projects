import asyncio
from datetime import datetime, timedelta
from faker import Faker
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
import sys
import os

# Add the parent directory to the sys.path to allow imports from `app`
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../')))

from app.core.config import settings
from app.database.base import Base
from app.database.models import User, Application, Metric, MetricData, MetricType
from app.core.security import get_password_hash, generate_api_key
from app.core.logging_config import setup_logging # Import logging setup

setup_logging() # Initialize logging

logger = logging.getLogger(__name__) # Use standard logging for simple script

# Determine DATABASE_URL based on environment or settings
DATABASE_URL = os.getenv("DATABASE_URL", settings.DATABASE_URL)
if not DATABASE_URL:
    logger.error("DATABASE_URL is not set. Cannot run seed script.")
    sys.exit(1)

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

fake = Faker()


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


async def seed_data():
    async for db in get_db():
        # Check if users already exist
        existing_admin = await db.execute(select(User).where(User.email == "admin@example.com"))
        if existing_admin.scalar_one_or_none():
            logger.info("Seed data already exists. Skipping seeding.")
            return

        logger.info("Seeding initial data...")

        # 1. Create Admin User
        admin_user = User(
            email="admin@example.com",
            hashed_password=get_password_hash("adminpassword"),
            is_active=True,
            is_admin=True,
        )
        db.add(admin_user)
        logger.info("Admin user created.")

        # 2. Create Regular User
        regular_user = User(
            email="user@example.com",
            hashed_password=get_password_hash("userpassword"),
            is_active=True,
            is_admin=False,
        )
        db.add(regular_user)
        logger.info("Regular user created.")

        await db.commit()
        await db.refresh(admin_user)
        await db.refresh(regular_user)

        # 3. Create Applications
        app1 = Application(
            name="Backend API Service",
            description="Main REST API for customer interactions.",
            api_key=generate_api_key(),
            owner_id=admin_user.id,
        )
        app2 = Application(
            name="Frontend Web App",
            description="User-facing web application.",
            api_key=generate_api_key(),
            owner_id=regular_user.id,
        )
        app3 = Application(
            name="Internal Microservice",
            description="Service for data processing.",
            api_key=generate_api_key(),
            owner_id=admin_user.id,
        )
        db.add_all([app1, app2, app3])
        await db.commit()
        await db.refresh(app1)
        await db.refresh(app2)
        await db.refresh(app3)
        logger.info("Applications created.")

        # 4. Create Metrics for Applications
        metrics_to_add = []
        metrics_to_add.append(
            Metric(
                app_id=app1.id,
                name="cpu_usage",
                unit="%",
                metric_type=MetricType.GAUGE,
                threshold_warning=70.0,
                threshold_critical=90.0,
            )
        )
        metrics_to_add.append(
            Metric(
                app_id=app1.id,
                name="request_latency_p95",
                unit="ms",
                metric_type=MetricType.GAUGE,
                threshold_warning=200.0,
                threshold_critical=500.0,
            )
        )
        metrics_to_add.append(
            Metric(
                app_id=app1.id, name="error_rate", unit="%", metric_type=MetricType.GAUGE,
                threshold_warning=1.0, threshold_critical=5.0
            )
        )
        metrics_to_add.append(
            Metric(
                app_id=app2.id, name="page_load_time", unit="ms", metric_type=MetricType.GAUGE,
                threshold_warning=1500.0, threshold_critical=3000.0
            )
        )
        metrics_to_add.append(
            Metric(
                app_id=app3.id, name="queue_depth", unit="count", metric_type=MetricType.GAUGE
            )
        )
        db.add_all(metrics_to_add)
        await db.commit()
        for m in metrics_to_add:
            await db.refresh(m)
        logger.info("Metrics created.")

        # 5. Generate sample Metric Data
        logger.info("Generating sample metric data...")
        metric_data_points = []
        now = datetime.utcnow().replace(second=0, microsecond=0) # Start from current minute
        
        # Simulate data for the last 2 hours, every minute
        for metric in metrics_to_add:
            for i in range(120): # 120 minutes = 2 hours
                timestamp = now - timedelta(minutes=i)
                value = 0.0

                if metric.name == "cpu_usage":
                    value = round(fake.random_int(min=10, max=90) + fake.random_float(min=0, max=9), 2)
                elif metric.name == "request_latency_p95":
                    value = round(fake.random_int(min=50, max=400) + fake.random_float(min=0, max=99), 2)
                elif metric.name == "error_rate":
                    value = round(fake.random_float(min=0.1, max=10.0), 2)
                elif metric.name == "page_load_time":
                    value = round(fake.random_int(min=500, max=2500) + fake.random_float(min=0, max=999), 2)
                elif metric.name == "queue_depth":
                    value = fake.random_int(min=0, max=500)
                else:
                    value = fake.random_int(min=1, max=100)

                metric_data_points.append(
                    MetricData(metric_id=metric.id, value=value, timestamp=timestamp)
                )
        
        # Add a burst of high CPU usage for app1 to simulate an event
        cpu_metric = next((m for m in metrics_to_add if m.name == "cpu_usage" and m.app_id == app1.id), None)
        if cpu_metric:
            for i in range(5): # 5 minutes of high CPU
                timestamp = now - timedelta(minutes=(i+125)) # A bit further back
                value = round(fake.random_int(min=90, max=99) + fake.random_float(min=0, max=9), 2)
                metric_data_points.append(
                    MetricData(metric_id=cpu_metric.id, value=value, timestamp=timestamp)
                )

        db.add_all(metric_data_points)
        await db.commit()
        logger.info(f"Generated {len(metric_data_points)} sample metric data points.")

        logger.info("Data seeding complete.")

import logging # Import standard logging for this script


if __name__ == "__main__":
    asyncio.run(seed_data())
    asyncio.run(engine.dispose())