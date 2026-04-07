from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import AsyncSessionLocal
from app.db import crud
from app.schemas.user import UserCreate
from app.schemas.database import DatabaseCreate
from app.schemas.metric import MetricCreate
from app.schemas.suggestion import OptimizationSuggestionCreate
from app.schemas.task import TaskCreate
from app.db.models import UserRole, DatabaseType, SuggestionType, TaskStatus
from app.core.security import get_password_hash
from app.core.config import settings
from loguru import logger
from datetime import datetime, timezone, timedelta
import random

async def create_initial_data():
    async with AsyncSessionLocal() as db:
        admin_user = await crud.user.get_by_email(db, email="admin@example.com")
        if not admin_user:
            logger.info("Creating initial admin user...")
            admin_user_in = UserCreate(
                username="admin",
                email="admin@example.com",
                password="adminpassword", # Use strong passwords in prod!
                full_name="System Administrator",
                is_active=True,
                is_admin=True,
                role=UserRole.ADMIN
            )
            hashed_password = get_password_hash(admin_user_in.password)
            admin_user = await crud.user.create_with_hashed_password(db, admin_user_in, hashed_password)
            logger.info("Admin user created.")
        else:
            logger.info("Admin user already exists.")
        
        test_user = await crud.user.get_by_email(db, email="user@example.com")
        if not test_user:
            logger.info("Creating initial test user...")
            test_user_in = UserCreate(
                username="testuser",
                email="user@example.com",
                password="testpassword", # Use strong passwords in prod!
                full_name="Test User",
                is_active=True,
                is_admin=False,
                role=UserRole.USER
            )
            hashed_password = get_password_hash(test_user_in.password)
            test_user = await crud.user.create_with_hashed_password(db, test_user_in, hashed_password)
            logger.info("Test user created.")
        else:
            logger.info("Test user already exists.")

        # Create sample databases for admin
        if admin_user:
            db1 = await crud.database.get_by_field(db, "name", "Prod_DB_Main")
            if not db1:
                logger.info("Creating sample databases for admin...")
                db1_in = DatabaseCreate(
                    name="Prod_DB_Main",
                    db_type=DatabaseType.POSTGRESQL,
                    host="192.168.1.100",
                    port=5432,
                    db_name="main_prod_db",
                    username="produser",
                    password="prodpassword",
                    description="Main production PostgreSQL database",
                    owner_id=admin_user.id
                )
                db1 = await crud.database.create(db, db1_in)

                db2_in = DatabaseCreate(
                    name="Dev_DB_Analytics",
                    db_type=DatabaseType.MYSQL,
                    host="192.168.1.101",
                    port=3306,
                    db_name="dev_analytics",
                    username="devuser",
                    password="devpassword",
                    description="Development MySQL database for analytics",
                    owner_id=admin_user.id
                )
                db2 = await crud.database.create(db, db2_in)
                logger.info("Sample databases created for admin.")
            else:
                logger.info("Admin sample databases already exist.")

            # Create sample metrics for Prod_DB_Main
            if db1:
                if not await crud.metric.get_multi_by_database(db, db1.id, limit=1):
                    logger.info(f"Creating sample metrics for {db1.name}...")
                    for i in range(10):
                        timestamp = datetime.now(timezone.utc) - timedelta(minutes=i*10)
                        metric_in = MetricCreate(
                            database_id=db1.id,
                            timestamp=timestamp,
                            cpu_usage_percent=round(random.uniform(20.0, 80.0), 2),
                            memory_usage_percent=round(random.uniform(30.0, 90.0), 2),
                            disk_io_ops_sec=round(random.uniform(100.0, 1500.0), 2),
                            active_connections=random.randint(50, 800),
                            total_queries_sec=round(random.uniform(500.0, 10000.0), 2),
                            avg_query_latency_ms=round(random.uniform(5.0, 300.0), 2),
                            slow_queries_json={
                                "count": random.randint(0, 5),
                                "examples": [
                                    f"SELECT * FROM orders WHERE customer_id = {random.randint(1,10000)} ORDER BY order_date DESC; -- duration: {random.randint(50, 1500)}ms",
                                    f"SELECT count(*) FROM products WHERE category = 'Electronics' AND price > {random.randint(100, 1000)}; -- duration: {random.randint(50, 1000)}ms"
                                ] if random.random() > 0.6 else []
                            }
                        )
                        await crud.metric.create(db, metric_in)
                    logger.info("Sample metrics created for Prod_DB_Main.")
                else:
                    logger.info("Sample metrics for Prod_DB_Main already exist.")
            
            # Create sample suggestions for Prod_DB_Main
            if db1:
                if not await crud.suggestion.get_multi_by_database(db, db1.id, limit=1):
                    logger.info(f"Creating sample suggestions for {db1.name}...")
                    sug1_in = OptimizationSuggestionCreate(
                        database_id=db1.id,
                        suggested_by_id=admin_user.id,
                        suggestion_type=SuggestionType.INDEX,
                        description="Add index to customer_id column in orders table to speed up customer-specific queries.",
                        sql_command="CREATE INDEX idx_orders_customer_id ON orders (customer_id);",
                        impact_estimate="High",
                        is_approved=True
                    )
                    sug1 = await crud.suggestion.create(db, sug1_in)

                    sug2_in = OptimizationSuggestionCreate(
                        database_id=db1.id,
                        suggested_by_id=admin_user.id,
                        suggestion_type=SuggestionType.QUERY_REWRITE,
                        description="Rewrite complex join query in analytics dashboard to use CTEs for better readability and performance.",
                        sql_command="WITH SalesData AS (...) SELECT ... FROM SalesData ...;",
                        impact_estimate="Medium",
                        is_approved=False
                    )
                    sug2 = await crud.suggestion.create(db, sug2_in)
                    logger.info("Sample suggestions created for Prod_DB_Main.")
                else:
                    logger.info("Sample suggestions for Prod_DB_Main already exist.")

            # Create sample tasks for Prod_DB_Main
            if db1 and admin_user and test_user:
                if not await crud.task.get_multi_by_database(db, db1.id, limit=1):
                    logger.info(f"Creating sample tasks for {db1.name}...")
                    task1_in = TaskCreate(
                        database_id=db1.id,
                        suggestion_id=sug1.id if 'sug1' in locals() else None,
                        assigned_to_id=admin_user.id,
                        title="Implement Index on orders.customer_id",
                        description="Implement the suggested index to improve order lookup performance.",
                        status=TaskStatus.PENDING,
                        priority="High",
                        due_date=datetime.now(timezone.utc) + timedelta(days=7)
                    )
                    await crud.task.create(db, task1_in)

                    task2_in = TaskCreate(
                        database_id=db1.id,
                        suggestion_id=sug2.id if 'sug2' in locals() else None,
                        assigned_to_id=test_user.id,
                        title="Review Analytics Query Rewrite",
                        description="Review and test the suggested query rewrite for the analytics dashboard.",
                        status=TaskStatus.IN_PROGRESS,
                        priority="Medium",
                        due_date=datetime.now(timezone.utc) + timedelta(days=14)
                    )
                    await crud.task.create(db, task2_in)
                    logger.info("Sample tasks created for Prod_DB_Main.")
                else:
                    logger.info("Sample tasks for Prod_DB_Main already exist.")

        # Create sample database for test user
        if test_user:
            user_db1 = await crud.database.get_by_field(db, "name", "My_Personal_DB")
            if not user_db1:
                logger.info("Creating sample database for test user...")
                user_db1_in = DatabaseCreate(
                    name="My_Personal_DB",
                    db_type=DatabaseType.POSTGRESQL,
                    host="localhost",
                    port=5432,
                    db_name="user_personal_db",
                    username="user",
                    password="userpassword",
                    description="Personal PostgreSQL database for testing",
                    owner_id=test_user.id
                )
                user_db1 = await crud.database.create(db, user_db1_in)
                logger.info("Sample database created for test user.")
            else:
                logger.info("Test user sample database already exists.")
```
(Note: The `initial_data.py` relies on `crud` and other services. It's safe to run this after `create_db_and_tables` in `main.py`'s lifespan.)
```python