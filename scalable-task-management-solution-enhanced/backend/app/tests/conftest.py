import asyncio
from typing import AsyncGenerator, Generator
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import NullPool
import os

from app.main import app
from app.core.config import settings
from app.core.db import Base, get_db
from app.auth.security import get_password_hash
from app.models.user import User
from app.models.project import Project
from app.models.task import Task, TaskStatus, TaskPriority
from app.models.task_comment import TaskComment
from app.schemas.user import UserCreate
from app.crud.user import user as crud_user

# Override settings for testing
os.environ["POSTGRES_DB"] = "test_db"
os.environ["POSTGRES_USER"] = "test_user"
os.environ["POSTGRES_PASSWORD"] = "test_password"
os.environ["POSTGRES_SERVER"] = "localhost" # Assuming DB runs locally or accessible directly
os.environ["SECRET_KEY"] = "super-secret-test-key-for-ci-only-do-not-use-in-prod"
os.environ["REDIS_URL"] = "redis://localhost:6379/1" # Use a different Redis DB for tests

# Create a test-specific async engine and sessionmaker
TEST_DATABASE_URL = str(settings.ASYNC_DATABASE_URL)
test_engine = create_async_engine(
    TEST_DATABASE_URL, poolclass=NullPool, future=True, echo=False
)
TestingSessionLocal = async_sessionmaker(
    autocommit=False, autoflush=False, bind=test_engine, class_=AsyncSession, expire_on_commit=False
)

async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
    async with TestingSessionLocal() as session:
        yield session

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="session")
def event_loop(request) -> Generator:
    """Fixture to provide an event loop for async tests."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session", autouse=True)
async def setup_test_database() -> AsyncGenerator:
    """
    Sets up a clean test database for the entire test session.
    Creates tables, yields, and drops tables.
    """
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all) # Ensure clean slate
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Provides an independent database session for each test function.
    Rolls back changes after each test.
    """
    async with TestingSessionLocal() as session:
        await session.begin_nested()  # Start a SAVEPOINT
        yield session
        await session.rollback()      # Rollback to the SAVEPOINT

@pytest.fixture(scope="function")
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """
    Provides an async HTTP client for testing FastAPI endpoints.
    Uses the overridden get_db dependency.
    """
    app.dependency_overrides[get_db] = lambda: db_session # Ensure client uses the session of the current test
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.pop(get_db) # Clean up

@pytest.fixture
async def create_user(db_session: AsyncSession):
    async def _create_user(
        username: str = "testuser",
        email: str = "test@example.com",
        password: str = "password123",
        is_superuser: bool = False,
        is_active: bool = True
    ) -> User:
        user_in = UserCreate(
            username=username,
            email=email,
            password=password,
            is_superuser=is_superuser,
            is_active=is_active
        )
        return await crud_user.create(db_session, obj_in=user_in)
    return _create_user

@pytest.fixture
async def superuser_token_headers(client: AsyncClient, create_user):
    user = await create_user(
        username=settings.FIRST_SUPERUSER_USERNAME,
        email=settings.FIRST_SUPERUSER_EMAIL,
        password=settings.FIRST_SUPERUSER_PASSWORD,
        is_superuser=True
    )
    response = await client.post(
        f"{settings.API_V1_STR}/auth/login",
        data={"username": user.email, "password": settings.FIRST_SUPERUSER_PASSWORD},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
async def regular_user_token_headers(client: AsyncClient, create_user):
    user = await create_user()
    response = await client.post(
        f"{settings.API_V1_STR}/auth/login",
        data={"username": user.email, "password": "password123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
async def create_project(db_session: AsyncSession):
    async def _create_project(
        name: str = "Test Project",
        description: str = "Description for test project",
        owner: User = None
    ) -> Project:
        if owner is None:
            owner = await crud_user.create(db_session, obj_in=UserCreate(username="projowner", email="projowner@example.com", password="password123"))
        project = Project(name=name, description=description, owner_id=owner.id)
        db_session.add(project)
        await db_session.commit()
        await db_session.refresh(project)
        project.owner = owner # Manually set for in-memory object consistency
        return project
    return _create_project

@pytest.fixture
async def create_task(db_session: AsyncSession):
    async def _create_task(
        project: Project = None,
        creator: User = None,
        assignee: User = None,
        title: str = "Test Task",
        status: TaskStatus = TaskStatus.TODO,
        priority: TaskPriority = TaskPriority.MEDIUM,
        due_date: datetime = None
    ) -> Task:
        if project is None:
            proj_owner = await crud_user.create(db_session, obj_in=UserCreate(username="taskprojowner", email="taskprojowner@example.com", password="password123"))
            project = Project(name="Task Project", description="Task Project Desc", owner_id=proj_owner.id)
            db_session.add(project)
            await db_session.commit()
            await db_session.refresh(project)
            project.owner = proj_owner
        if creator is None:
            creator = project.owner # Default to project owner
        if due_date is None:
            due_date = datetime.now(timezone.utc) + timedelta(days=7)

        task = Task(
            title=title,
            description="Task description",
            status=status,
            priority=priority,
            due_date=due_date,
            project_id=project.id,
            creator_id=creator.id,
            assignee_id=assignee.id if assignee else None
        )
        db_session.add(task)
        await db_session.commit()
        await db_session.refresh(task)
        task.project = project
        task.creator = creator
        task.assignee = assignee
        return task
    return _create_task

@pytest.fixture
async def create_task_comment(db_session: AsyncSession):
    async def _create_task_comment(
        task: Task = None,
        user: User = None,
        comment_text: str = "This is a test comment"
    ) -> TaskComment:
        if task is None:
            task = await create_task(db_session)()
        if user is None:
            user = await crud_user.create(db_session, obj_in=UserCreate(username="commenter", email="commenter@example.com", password="password123"))
        
        comment = TaskComment(
            comment_text=comment_text,
            task_id=task.id,
            user_id=user.id
        )
        db_session.add(comment)
        await db_session.commit()
        await db_session.refresh(comment)
        comment.task = task
        comment.user = user
        return comment
    return _create_task_comment