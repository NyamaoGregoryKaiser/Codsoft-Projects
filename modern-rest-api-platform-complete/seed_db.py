import asyncio
from datetime import datetime
import os
import sys

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import text
from app.core.security import get_password_hash
from app.models.user import User
from app.models.project import Project
from app.models.task import TaskStatus, TaskPriority, Task
from app.models.comment import Comment
from app.core.config import settings

# This script assumes that 'app' is importable.
# If running directly, make sure to adjust sys.path or run from project root.
sys.path.append(os.path.dirname(os.path.abspath(__file__)))


async def seed_data():
    """Seeds the database with initial users, projects, tasks, and comments."""
    print("Starting database seeding...")

    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    AsyncSessionLocal = async_sessionmaker(autocommit=False, autoflush=False, bind=engine)

    async with AsyncSessionLocal() as session:
        # Check if any user exists to prevent duplicate seeding on every run
        existing_users = await session.execute(text("SELECT id FROM users LIMIT 1"))
        if existing_users.scalar_one_or_none():
            print("Database already contains users. Skipping seed data to prevent duplicates.")
            await session.close()
            await engine.dispose()
            return

        print("No users found. Proceeding with seeding...")

        # Create Admin User
        admin_user = User(
            email="admin@example.com",
            hashed_password=get_password_hash("adminpassword"),
            is_active=True,
            is_admin=True,
        )
        session.add(admin_user)
        await session.flush() # Flush to get ID for owner_id

        # Create Regular User
        regular_user = User(
            email="user@example.com",
            hashed_password=get_password_hash("userpassword"),
            is_active=True,
            is_admin=False,
        )
        session.add(regular_user)
        await session.flush()

        print("Users created: admin@example.com, user@example.com")

        # Create Projects
        project1 = Project(
            title="Website Redesign",
            description="Redesign the company website with a modern look and improved UX.",
            owner_id=admin_user.id,
        )
        project2 = Project(
            title="Mobile App Development",
            description="Develop a new mobile application for iOS and Android platforms.",
            owner_id=regular_user.id,
        )
        project3 = Project(
            title="Backend API Enhancement",
            description="Improve performance and add new features to the existing backend API.",
            owner_id=admin_user.id,
        )
        session.add_all([project1, project2, project3])
        await session.flush()
        print("Projects created.")

        # Create Tasks for Project 1 (Website Redesign)
        task1_1 = Task(
            title="Design UI/UX Mockups",
            description="Create wireframes and high-fidelity mockups for key website pages.",
            status=TaskStatus.in_progress,
            priority=TaskPriority.high,
            project_id=project1.id,
            assigned_to_id=admin_user.id,
        )
        task1_2 = Task(
            title="Develop Frontend Components",
            description="Implement reusable React components based on design mockups.",
            status=TaskStatus.todo,
            priority=TaskPriority.medium,
            project_id=project1.id,
            assigned_to_id=regular_user.id,
        )
        task1_3 = Task(
            title="Integrate API Endpoints",
            description="Connect frontend components to backend API for data fetching and submission.",
            status=TaskStatus.todo,
            priority=TaskPriority.high,
            project_id=project1.id,
            assigned_to_id=admin_user.id,
        )
        session.add_all([task1_1, task1_2, task1_3])
        await session.flush()
        print("Tasks for Project 1 created.")

        # Create Tasks for Project 2 (Mobile App Development)
        task2_1 = Task(
            title="Set up React Native Project",
            description="Initialize React Native project and configure development environment.",
            status=TaskStatus.done,
            priority=TaskPriority.medium,
            project_id=project2.id,
            assigned_to_id=regular_user.id,
        )
        task2_2 = Task(
            title="Implement User Authentication",
            description="Build login, registration, and user profile screens.",
            status=TaskStatus.in_progress,
            priority=TaskPriority.high,
            project_id=project2.id,
            assigned_to_id=admin_user.id,
        )
        session.add_all([task2_1, task2_2])
        await session.flush()
        print("Tasks for Project 2 created.")

        # Create Comments for Task 1_1
        comment1_1_1 = Comment(
            content="Initial wireframes are ready for review.",
            task_id=task1_1.id,
            author_id=admin_user.id,
        )
        comment1_1_2 = Comment(
            content="Please add a dark mode toggle to the mockups.",
            task_id=task1_1.id,
            author_id=regular_user.id,
        )
        session.add_all([comment1_1_1, comment1_1_2])
        await session.flush()
        print("Comments created.")

        await session.commit()
        print("Database seeding completed successfully.")

    await engine.dispose()
    print("Database engine disposed.")


if __name__ == "__main__":
    asyncio.run(seed_data())
```