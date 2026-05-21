import asyncio
import logging
from datetime import datetime, timedelta, timezone

from faker import Faker
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.config import settings
from app.core.db import AsyncSessionLocal, engine, Base
from app.crud.user import user as crud_user
from app.crud.project import project as crud_project
from app.crud.task import task as crud_task
from app.crud.task_comment import task_comment as crud_task_comment
from app.schemas.user import UserCreate
from app.schemas.project import ProjectCreate
from app.schemas.task import TaskCreate, TaskStatus, TaskPriority
from app.schemas.task_comment import TaskCommentCreate
from app.models.user import User
from app.models.project import Project
from app.models.task import Task
from app.models.task_comment import TaskComment

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

fake = Faker()

async def init_db() -> None:
    logger.info("Creating database tables if they don't exist...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables creation complete.")

async def seed_data() -> None:
    logger.info("Starting database seeding...")
    async with AsyncSessionLocal() as db:
        # Create a superuser
        superuser = await crud_user.get_by_email(db, email=settings.FIRST_SUPERUSER_EMAIL)
        if not superuser:
            logger.info("Creating superuser...")
            superuser_in = UserCreate(
                username=settings.FIRST_SUPERUSER_USERNAME,
                email=settings.FIRST_SUPERUSER_EMAIL,
                password=settings.FIRST_SUPERUSER_PASSWORD,
                is_superuser=True,
            )
            superuser = await crud_user.create(db, obj_in=superuser_in)
            logger.info(f"Superuser '{superuser.email}' created.")
        else:
            logger.info(f"Superuser '{superuser.email}' already exists.")

        # Create some regular users
        users = [superuser]
        for i in range(5):
            email = f"user{i+1}@example.com"
            username = f"testuser{i+1}"
            regular_user = await crud_user.get_by_email(db, email=email)
            if not regular_user:
                logger.info(f"Creating regular user '{email}'...")
                user_in = UserCreate(
                    username=username,
                    email=email,
                    password="password123",
                    is_superuser=False,
                )
                regular_user = await crud_user.create(db, obj_in=user_in)
            users.append(regular_user)
        logger.info(f"{len(users)-1} regular users ensured.")

        # Create some projects
        projects = []
        for i in range(10):
            owner = fake.random_element(elements=users)
            project_name = fake.company() + " Project"
            project_description = fake.paragraph(nb_sentences=3)
            
            existing_project = await db.execute(select(Project).filter(Project.name == project_name))
            if existing_project.scalar_one_or_none():
                logger.info(f"Project '{project_name}' already exists. Skipping.")
                continue

            project_in = ProjectCreate(name=project_name, description=project_description)
            project_obj = await crud_project.create(db, obj_in=project_in, owner_id=owner.id)
            projects.append(project_obj)
        logger.info(f"{len(projects)} projects created/ensured.")

        # Create some tasks for each project
        tasks = []
        for project_obj in projects:
            num_tasks = fake.random_int(min=2, max=7)
            for _ in range(num_tasks):
                creator = project_obj.owner # Project owner is typically the creator
                assignee = fake.random_element(elements=users + [None]) # Can be unassigned
                status = fake.random_element(elements=list(TaskStatus))
                priority = fake.random_element(elements=list(TaskPriority))
                due_date = fake.future_datetime(end_date="+30d", tzinfo=timezone.utc)

                task_title = fake.catch_phrase()
                task_description = fake.sentence(nb_words=10)

                existing_task = await db.execute(select(Task).filter(Task.title == task_title, Task.project_id == project_obj.id))
                if existing_task.scalar_one_or_none():
                    logger.info(f"Task '{task_title}' in project '{project_obj.name}' already exists. Skipping.")
                    continue

                task_in = TaskCreate(
                    title=task_title,
                    description=task_description,
                    status=status,
                    priority=priority,
                    due_date=due_date,
                    project_id=project_obj.id,
                    assignee_id=assignee.id if assignee else None,
                )
                task_obj = await crud_task_comment.create(db, obj_in=task_in, creator_id=creator.id) # Use task_crud_with_creator
                tasks.append(task_obj)
        logger.info(f"{len(tasks)} tasks created/ensured.")
        
        # Create some comments for tasks
        comments = []
        for task_obj in tasks:
            num_comments = fake.random_int(min=0, max=3)
            for _ in range(num_comments):
                comment_user = fake.random_element(elements=users)
                comment_text = fake.sentence(nb_words=8)

                comment_in = TaskCommentCreate(comment_text=comment_text, task_id=task_obj.id)
                comment_obj = await crud_task_comment.create(db, obj_in=comment_in, task_id=task_obj.id, user_id=comment_user.id)
                comments.append(comment_obj)
        logger.info(f"{len(comments)} comments created/ensured.")

    logger.info("Database seeding complete.")

if __name__ == "__main__":
    # Import necessary CRUD instances that expect `creator_id` and `owner_id`
    # This workaround is needed because the generic `crud_base.create` doesn't know about these extra args.
    # In a real system, you might modify CRUDBase or have specialized CRUD methods.
    from app.api.endpoints.projects import project_crud_with_owner as crud_project
    from app.api.endpoints.tasks import task_crud_with_creator as crud_task

    async def main():
        # await init_db() # Run migrations via Alembic, not here for production
        await seed_data()

    asyncio.run(main())