import logging
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.base import Base, engine
from app.db.models import User, Project, Task, Comment, UserRole, TaskStatus, TaskPriority
from app.core.security import get_password_hash
from app.core.config import settings

logger = logging.getLogger(__name__)

async def create_db_and_tables():
    logger.info("Creating database tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables created.")

async def init_db(db: AsyncSession) -> None:
    # Check if superuser already exists
    admin_user = await db.scalar(User.__table__.select().where(User.email == settings.FIRST_SUPERUSER_EMAIL))

    if not admin_user:
        logger.info("Creating initial superuser...")
        hashed_password = get_password_hash(settings.FIRST_SUPERUSER_PASSWORD)
        admin = User(
            email=settings.FIRST_SUPERUSER_EMAIL,
            hashed_password=hashed_password,
            full_name="Admin User",
            is_superuser=True,
            is_active=True,
            role=UserRole.ADMIN
        )
        db.add(admin)
        await db.flush() # Flush to get the ID for the admin user

        # Create some seed data
        user1 = User(
            email="user1@example.com",
            hashed_password=get_password_hash("password123"),
            full_name="Regular User One",
            is_superuser=False,
            is_active=True,
            role=UserRole.USER
        )
        user2 = User(
            email="user2@example.com",
            hashed_password=get_password_hash("password123"),
            full_name="Regular User Two",
            is_superuser=False,
            is_active=True,
            role=UserRole.USER
        )
        db.add_all([user1, user2])
        await db.flush()

        # Get the IDs for relationships
        admin_id = admin.id
        user1_id = user1.id
        user2_id = user2.id

        project1 = Project(
            title="Website Redesign",
            description="Redesign the company website with modern UI/UX.",
            owner_id=admin_id
        )
        project2 = Project(
            title="Mobile App Development",
            description="Develop a new mobile application for iOS and Android.",
            owner_id=user1_id
        )
        db.add_all([project1, project2])
        await db.flush()

        project1_id = project1.id
        project2_id = project2.id

        task1 = Task(
            title="Design UI mockups",
            description="Create wireframes and high-fidelity mockups for key pages.",
            status=TaskStatus.IN_PROGRESS,
            priority=TaskPriority.HIGH,
            due_date=datetime.utcnow() + timedelta(days=7),
            project_id=project1_id,
            assignee_id=user1_id,
            creator_id=admin_id
        )
        task2 = Task(
            title="Develop authentication module",
            description="Implement user registration, login, and JWT token handling.",
            status=TaskStatus.OPEN,
            priority=TaskPriority.URGENT,
            due_date=datetime.utcnow() + timedelta(days=3),
            project_id=project1_id,
            assignee_id=admin_id,
            creator_id=admin_id
        )
        task3 = Task(
            title="Database schema design",
            description="Define tables, relationships, and migrations for the mobile app backend.",
            status=TaskStatus.DONE,
            priority=TaskPriority.MEDIUM,
            due_date=datetime.utcnow() - timedelta(days=2),
            project_id=project2_id,
            assignee_id=user2_id,
            creator_id=user1_id
        )
        task4 = Task(
            title="Frontend component library",
            description="Build reusable UI components for the mobile app.",
            status=TaskStatus.IN_PROGRESS,
            priority=TaskPriority.HIGH,
            due_date=datetime.utcnow() + timedelta(days=10),
            project_id=project2_id,
            assignee_id=user1_id,
            creator_id=user1_id
        )
        db.add_all([task1, task2, task3, task4])
        await db.flush()

        task1_id = task1.id
        task3_id = task3.id

        comment1 = Comment(
            content="Initial thoughts on design direction: focus on minimalism.",
            task_id=task1_id,
            author_id=admin_id
        )
        comment2 = Comment(
            content="Agreed. Let's start with a dark mode theme.",
            task_id=task1_id,
            author_id=user1_id
        )
        comment3 = Comment(
            content="Schema approved, starting implementation now.",
            task_id=task3_id,
            author_id=user2_id
        )
        db.add_all([comment1, comment2, comment3])
        await db.commit()
        logger.info("Superuser and seed data created.")
    else:
        logger.info("Superuser already exists. Skipping initial data creation.")