import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import AsyncSessionLocal, engine
from app.models.user import User
from app.models.dataset import Dataset
from app.models.dashboard import Dashboard
from app.models.chart import Chart
from app.core.security import get_password_hash
from app.utils.logger import get_logger

logger = get_logger()

async def create_superuser(db: AsyncSession):
    email = "admin@example.com"
    password = "adminpassword"

    existing_user = await db.execute(User.__table__.select().where(User.email == email))
    if existing_user.scalar_one_or_none():
        logger.info(f"Superuser '{email}' already exists.")
        return

    hashed_password = get_password_hash(password)
    superuser = User(
        email=email,
        hashed_password=hashed_password,
        is_active=True,
        is_superuser=True,
    )
    db.add(superuser)
    await db.commit()
    await db.refresh(superuser)
    logger.info(f"Created superuser: {email}")
    return superuser

async def create_demo_user(db: AsyncSession):
    email = "user@example.com"
    password = "userpassword"

    existing_user = await db.execute(User.__table__.select().where(User.email == email))
    if existing_user.scalar_one_or_none():
        logger.info(f"Demo user '{email}' already exists.")
        return

    hashed_password = get_password_hash(password)
    demo_user = User(
        email=email,
        hashed_password=hashed_password,
        is_active=True,
        is_superuser=False,
    )
    db.add(demo_user)
    await db.commit()
    await db.refresh(demo_user)
    logger.info(f"Created demo user: {email}")
    return demo_user

async def create_sample_data(db: AsyncSession, owner_id: int):
    # Create sample dataset
    sample_dataset = Dataset(
        name="Sales Data Q1 2024",
        description="Quarterly sales figures for demonstration.",
        source_type="csv",
        source_config={"file_path": "/app/data/sales_q1_2024.csv"}, # Placeholder, refer to data retrieval in dataset_service
        owner_id=owner_id
    )
    db.add(sample_dataset)
    await db.commit()
    await db.refresh(sample_dataset)
    logger.info(f"Created sample dataset: {sample_dataset.name}")

    # Create sample dashboard
    sample_dashboard = Dashboard(
        title="Q1 Sales Overview",
        description="Key performance indicators for Q1 sales.",
        owner_id=owner_id
    )
    db.add(sample_dashboard)
    await db.commit()
    await db.refresh(sample_dashboard)
    logger.info(f"Created sample dashboard: {sample_dashboard.title}")

    # Create sample charts
    chart1 = Chart(
        title="Monthly Revenue",
        description="Revenue by month",
        chart_type="bar",
        config={
            "x_axis": "category", # This matches the mock data from dataset_service
            "y_axis": "value",
            "options": {
                "responsive": True,
                "plugins": {"legend": {"position": "top"}, "title": {"display": True, "text": "Monthly Revenue"}},
                "scales": {"x": {"stacked": True}, "y": {"stacked": True}}
            }
        },
        dataset_id=sample_dataset.id,
        dashboard_id=sample_dashboard.id,
        owner_id=owner_id
    )
    db.add(chart1)
    
    chart2 = Chart(
        title="Product Sales Distribution",
        description="Sales distribution across different products",
        chart_type="pie",
        config={
            "x_axis": "category",
            "y_axis": "value",
            "options": {
                "responsive": True,
                "plugins": {"legend": {"position": "top"}, "title": {"display": True, "text": "Product Sales Distribution"}},
            }
        },
        dataset_id=sample_dataset.id,
        dashboard_id=sample_dashboard.id,
        owner_id=owner_id
    )
    db.add(chart2)

    await db.commit()
    await db.refresh(chart1)
    await db.refresh(chart2)
    logger.info(f"Created sample charts for dashboard: {sample_dashboard.title}")


async def seed_database():
    logger.info("Starting database seeding...")
    async with AsyncSessionLocal() as db:
        admin_user = await create_superuser(db)
        demo_user = await create_demo_user(db)
        
        if demo_user:
            await create_sample_data(db, demo_user.id)

    logger.info("Database seeding complete.")

if __name__ == "__main__":
    asyncio.run(seed_database())
```