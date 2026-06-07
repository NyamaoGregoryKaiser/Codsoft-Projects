```python
import asyncio
import os
from typing import AsyncGenerator, Generator
from datetime import datetime, timedelta, timezone

import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.core.config import settings
from app.core.database import get_db_session, Base
from app.core.security import create_access_token, get_password_hash
from app.models.user import User
from app.models.chat import ChatRoom, ChatRoomMember, Message
from app.utils.cache import redis_client as app_redis_client # Alias to avoid conflict

# --- Test Database Setup ---
# Override database URL for tests to use a dedicated test database
TEST_DATABASE_URL = settings.DATABASE_URL.replace(settings.POSTGRES_DB, f"{settings.POSTGRES_DB}_test")
test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestingSessionLocal = async_sessionmaker(
    autocommit=False, autoflush=False, bind=test_engine, class_=AsyncSession, expire_on_commit=False
)

async def override_get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Override for get_db_session dependency to use the test database.
    Manages session lifecycle for tests.
    """
    async with TestingSessionLocal() as session:
        yield session

# Apply the override to the FastAPI app
app.dependency_overrides[get_db_session] = override_get_db_session

@pytest_asyncio.fixture(scope="session")
async def setup_test_db():
    """
    Fixture to create and drop test database tables.
    Runs once per test session.
    """
    # Ensure test database is clean before running tests
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    
    # Initialize Redis client for tests (if not already done by app lifespan)
    await app_redis_client.init()

    yield  # Run tests

    # Clean up test database after all tests are done
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    
    await app_redis_client.close()

@pytest.fixture(scope="function", autouse=True)
async def db_session_clear(setup_test_db):
    """
    Fixture to clear data from tables after each test function.
    """
    async with TestingSessionLocal() as session:
        # Delete data from all tables, minding foreign key constraints
        await session.execute(text("DELETE FROM messages"))
        await session.execute(text("DELETE FROM chat_room_members"))
        await session.execute(text("DELETE FROM chat_rooms"))
        await session.execute(text("DELETE FROM users"))
        await session.commit()
    
    # Clear Redis for each test
    await app_redis_client.client.flushdb()
    
    yield
    # Post-test cleanup (already done by db_session_clear)

# --- Test Client for API requests ---
@pytest_asyncio.fixture(scope="session")
async def client() -> AsyncGenerator[AsyncClient, None]:
    """
    Fixture for an asynchronous HTTP client to interact with the FastAPI app.
    """
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

# --- Test User Fixtures ---
@pytest_asyncio.fixture(scope="function")
async def test_db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Provides an async database session for individual test functions.
    """
    async with TestingSessionLocal() as session:
        yield session

@pytest_asyncio.fixture(scope="function")
async def create_test_user(test_db_session: AsyncSession):
    """
    Fixture to create a test user for individual tests.
    """
    async def _create_user(username: str = "testuser", email: str = "test@example.com", 
                           password: str = "securepassword", is_admin: bool = False) -> User:
        hashed_password = get_password_hash(password)
        user = User(
            username=username,
            email=email,
            hashed_password=hashed_password,
            is_active=True,
            is_admin=is_admin
        )
        test_db_session.add(user)
        await test_db_session.commit()
        await test_db_session.refresh(user)
        return user
    return _create_user

@pytest_asyncio.fixture(scope="function")
async def normal_user(create_test_user) -> User:
    """
    A regular non-admin test user.
    """
    return await create_test_user(username="normaluser", email="normal@example.com", is_admin=False)

@pytest_asyncio.fixture(scope="function")
async def admin_user(create_test_user) -> User:
    """
    An admin test user.
    """
    return await create_test_user(username="adminuser", email="admin@example.com", is_admin=True)

@pytest_asyncio.fixture(scope="function")
async def inactive_user(create_test_user) -> User:
    """
    An inactive test user.
    """
    user = await create_test_user(username="inactiveuser", email="inactive@example.com")
    user.is_active = False
    async with TestingSessionLocal() as session:
        session.add(user)
        await session.commit()
        await session.refresh(user)
    return user

@pytest_asyncio.fixture(scope="function")
async def normal_user_token(client: AsyncClient, normal_user: User) -> str:
    """
    Provides a JWT token for the normal test user.
    """
    access_token = create_access_token(data={"sub": normal_user.id})
    return access_token

@pytest_asyncio.fixture(scope="function")
async def admin_user_token(client: AsyncClient, admin_user: User) -> str:
    """
    Provides a JWT token for the admin test user.
    """
    access_token = create_access_token(data={"sub": admin_user.id})
    return access_token

# --- Chat Room Fixtures ---
@pytest_asyncio.fixture(scope="function")
async def create_test_chat_room(test_db_session: AsyncSession):
    """
    Fixture to create a test chat room.
    """
    async def _create_chat_room(name: str = "Test Room", creator_id: int = None, users_to_add: list[User] = None) -> ChatRoom:
        chat_room = ChatRoom(name=name)
        test_db_session.add(chat_room)
        await test_db_session.commit()
        await test_db_session.refresh(chat_room)

        if creator_id:
            member = ChatRoomMember(user_id=creator_id, chat_room_id=chat_room.id)
            test_db_session.add(member)
            await test_db_session.commit()
            await test_db_session.refresh(member)
        
        if users_to_add:
            for user in users_to_add:
                # Ensure creator_id is not duplicated if already added
                if creator_id == user.id:
                    continue
                member = ChatRoomMember(user_id=user.id, chat_room_id=chat_room.id)
                test_db_session.add(member)
                await test_db_session.commit()
                await test_db_session.refresh(member)

        # Refresh with relationships loaded for cleaner access in tests
        await test_db_session.refresh(chat_room, attribute_names=['members', 'messages'])
        return chat_room
    return _create_chat_room

@pytest_asyncio.fixture(scope="function")
async def chat_room_with_two_members(create_test_chat_room, normal_user, admin_user) -> ChatRoom:
    """
    A test chat room with two members: a normal user and an admin user.
    """
    chat_room = await create_test_chat_room(name="Shared Chat", creator_id=normal_user.id, users_to_add=[admin_user])
    return chat_room

# --- Message Fixtures ---
@pytest_asyncio.fixture(scope="function")
async def create_test_message(test_db_session: AsyncSession):
    """
    Fixture to create a test message.
    """
    async def _create_message(chat_room: ChatRoom, sender: User, content: str = "Hello, chat!") -> Message:
        message = Message(chat_room_id=chat_room.id, sender_id=sender.id, content=content)
        test_db_session.add(message)
        await test_db_session.commit()
        await test_db_session.refresh(message)
        await test_db_session.refresh(message, attribute_names=['sender']) # Load sender for schema
        return message
    return _create_message

@pytest_asyncio.fixture(scope="function")
async def populate_chat_messages(create_test_message, chat_room_with_two_members, normal_user, admin_user):
    """
    Populates a chat room with some messages.
    """
    await create_test_message(chat_room_with_two_members, normal_user, "Hi there from normal user!")
    await create_test_message(chat_room_with_two_members, admin_user, "Admin checking in.")
    await create_test_message(chat_room_with_two_members, normal_user, "How are you doing?")

```