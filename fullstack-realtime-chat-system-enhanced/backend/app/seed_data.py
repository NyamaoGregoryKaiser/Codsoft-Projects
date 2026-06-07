```python
import asyncio
import logging
from datetime import datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.core.config import settings
from app.core.database import AsyncSessionLocal, engine, Base
from app.core.security import get_password_hash
from app.crud.user import user as crud_user
from app.crud.chat import chat_room as crud_chat_room, message as crud_message
from app.schemas.user import UserCreate
from app.schemas.chat import ChatRoomCreate
from app.schemas.message import MessageCreate
from app.models.user import User
from app.models.chat import ChatRoom, Message

logger = logging.getLogger(__name__)

async def seed_data(db: AsyncSession):
    """
    Seeds the database with initial users, chat rooms, and messages.
    """
    logger.info("Starting database seeding...")

    # 1. Create Users
    users_to_create = [
        {"username": "alice", "email": "alice@example.com", "password": "password123", "is_admin": True},
        {"username": "bob", "email": "bob@example.com", "password": "password123"},
        {"username": "charlie", "email": "charlie@example.com", "password": "password123"},
        {"username": "diana", "email": "diana@example.com", "password": "password123"},
    ]

    created_users: dict[str, User] = {}
    for user_data in users_to_create:
        existing_user = await crud_user.get_by_email(db, email=user_data["email"])
        if not existing_user:
            user_in = UserCreate(username=user_data["username"], email=user_data["email"], password=user_data["password"])
            hashed_password = get_password_hash(user_data["password"])
            user = await crud_user.create_with_hashed_password(db, obj_in=user_in, hashed_password=hashed_password)
            user.is_admin = user_data.get("is_admin", False)
            db.add(user) # Re-add to session for update
            await db.commit()
            await db.refresh(user)
            created_users[user.username] = user
            logger.info(f"Created user: {user.username}")
        else:
            created_users[existing_user.username] = existing_user
            logger.info(f"User already exists: {existing_user.username}")
    
    # Ensure IDs are available
    alice_id = created_users["alice"].id
    bob_id = created_users["bob"].id
    charlie_id = created_users["charlie"].id
    diana_id = created_users["diana"].id

    # 2. Create Chat Rooms
    chat_rooms_to_create = [
        {"name": "General Chat", "members": [alice_id, bob_id, charlie_id, diana_id]},
        {"name": "Dev Team", "members": [alice_id, bob_id]},
        {"name": "Marketing Team", "members": [charlie_id, diana_id]},
        {"name": "Pythonistas", "members": [alice_id, charlie_id]},
    ]

    created_chat_rooms: dict[str, ChatRoom] = {}
    for room_data in chat_rooms_to_create:
        existing_room = await db.execute(text(f"SELECT * FROM chat_rooms WHERE name = '{room_data['name']}'"))
        if not existing_room.first():
            room_in = ChatRoomCreate(name=room_data["name"])
            chat_room = await crud_chat_room.create(db, obj_in=room_in)
            created_chat_rooms[chat_room.name] = chat_room
            logger.info(f"Created chat room: {chat_room.name}")
            for member_id in room_data["members"]:
                await crud_chat_room.add_member(db, chat_room.id, member_id)
        else:
            chat_room_obj = await db.execute(select(ChatRoom).filter(ChatRoom.name == room_data["name"]))
            created_chat_rooms[room_data["name"]] = chat_room_obj.scalars().first()
            logger.info(f"Chat room already exists: {room_data['name']}")
            for member_id in room_data["members"]:
                await crud_chat_room.add_member(db, created_chat_rooms[room_data["name"]].id, member_id)


    general_chat_id = created_chat_rooms["General Chat"].id
    dev_team_chat_id = created_chat_rooms["Dev Team"].id
    pythonistas_chat_id = created_chat_rooms["Pythonistas"].id

    # 3. Create Messages
    messages_to_create = [
        # General Chat
        {"chat_room_id": general_chat_id, "sender_id": alice_id, "content": "Hello everyone! Welcome to the chat app."},
        {"chat_room_id": general_chat_id, "sender_id": bob_id, "content": "Hi Alice! Looking good."},
        {"chat_room_id": general_chat_id, "sender_id": charlie_id, "content": "Excited to try this out."},
        {"chat_room_id": general_chat_id, "sender_id": diana_id, "content": "Me too! Real-time features are amazing."},
        {"chat_room_id": general_chat_id, "sender_id": alice_id, "content": "Feel free to explore and send messages."},
        {"chat_room_id": general_chat_id, "sender_id": bob_id, "content": "Any plans for new features?"},
        
        # Dev Team
        {"chat_room_id": dev_team_chat_id, "sender_id": alice_id, "content": "Devs, let's discuss the next sprint tasks."},
        {"chat_room_id": dev_team_chat_id, "sender_id": bob_id, "content": "I'm focusing on the WebSocket implementation."},
        {"chat_room_id": dev_team_chat_id, "sender_id": alice_id, "content": "Great, Bob! I'll review the API endpoints."},
        
        # Pythonistas
        {"chat_room_id": pythonistas_chat_id, "sender_id": alice_id, "content": "Who's working with FastAPI here?"},
        {"chat_room_id": pythonistas_chat_id, "sender_id": charlie_id, "content": "I am! It's a fantastic framework."},
        {"chat_room_id": pythonistas_chat_id, "sender_id": alice_id, "content": "Agreed. Pydantic and type hints are game changers."},
    ]

    for i, msg_data in enumerate(messages_to_create):
        # Create messages with slightly varied timestamps to simulate natural flow
        # This requires manually adjusting `created_at` after creation if needed, or by using a custom create function.
        # For simplicity, we just create them sequentially.
        message_in = MessageCreate(chat_room_id=msg_data["chat_room_id"], content=msg_data["content"])
        await crud_message.create_message(db, chat_room_id=msg_data["chat_room_id"], sender_id=msg_data["sender_id"], content=msg_data["content"])
        logger.debug(f"Created message in chat {msg_data['chat_room_id']}.")

    logger.info("Database seeding complete.")

async def init_db():
    """
    Initializes the database schema and seeds it with data.
    """
    logger.info("Ensuring all tables are created...")
    # This ensures tables are created if Alembic hasn't run, primarily for local dev/testing.
    # In production, Alembic migrations should handle this.
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Tables checked/created.")

    async with AsyncSessionLocal() as session:
        await seed_data(session)

if __name__ == "__main__":
    import os
    # Load .env file for local execution if not running via docker-compose
    from dotenv import load_dotenv
    load_dotenv(override=True)
    
    # Setup logging for the script
    logging.basicConfig(level=logging.INFO, format=settings.LOG_FORMAT)

    logger.info("Running database initialization and seeding script...")
    asyncio.run(init_db())
    logger.info("Database script finished.")

```