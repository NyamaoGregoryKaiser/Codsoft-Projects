```python
import logging
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.orm import joinedload
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.base import CRUDBase
from app.models.chat import ChatRoom, ChatRoomMember, Message
from app.schemas.chat import ChatRoomCreate, ChatRoomUpdate
from app.schemas.message import MessageCreate

logger = logging.getLogger(__name__)

class CRUDChatRoom(CRUDBase[ChatRoom, ChatRoomCreate, ChatRoomUpdate]):
    """
    CRUD operations for ChatRoom model.
    """
    async def get_user_chat_rooms(self, db: AsyncSession, user_id: int) -> List[ChatRoom]:
        """
        Retrieves all chat rooms a user is a member of.

        Args:
            db (AsyncSession): The asynchronous database session.
            user_id (int): The ID of the user.

        Returns:
            List[ChatRoom]: A list of chat rooms the user belongs to.
        """
        result = await db.execute(
            select(ChatRoom)
            .join(ChatRoomMember)
            .filter(ChatRoomMember.user_id == user_id)
            .options(joinedload(ChatRoom.members).joinedload(ChatRoomMember.member)) # Eager load members
            .options(joinedload(ChatRoom.messages)) # Eager load messages (can be limited in service)
            .order_by(ChatRoom.updated_at.desc())
        )
        return list(result.scalars().unique().all())

    async def get_with_details(self, db: AsyncSession, chat_room_id: int) -> Optional[ChatRoom]:
        """
        Retrieves a chat room with its members and latest messages.

        Args:
            db (AsyncSession): The asynchronous database session.
            chat_room_id (int): The ID of the chat room.

        Returns:
            Optional[ChatRoom]: The chat room instance with details, or None.
        """
        result = await db.execute(
            select(ChatRoom)
            .filter(ChatRoom.id == chat_room_id)
            .options(
                joinedload(ChatRoom.members).joinedload(ChatRoomMember.member), # Eager load members and their user objects
                # Eager load messages, order by creation and limit for performance
                joinedload(ChatRoom.messages).joinedload(Message.sender)
            )
        )
        return result.scalars().first()

    async def add_member(self, db: AsyncSession, chat_room_id: int, user_id: int) -> Optional[ChatRoomMember]:
        """
        Adds a user as a member to a chat room.

        Args:
            db (AsyncSession): The asynchronous database session.
            chat_room_id (int): The ID of the chat room.
            user_id (int): The ID of the user to add.

        Returns:
            Optional[ChatRoomMember]: The created membership object, or None if already a member.
        """
        existing_member = await db.execute(
            select(ChatRoomMember)
            .filter(ChatRoomMember.chat_room_id == chat_room_id, ChatRoomMember.user_id == user_id)
        )
        if existing_member.scalars().first():
            logger.info(f"User {user_id} is already a member of chat room {chat_room_id}.")
            return None # User is already a member

        db_chat_member = ChatRoomMember(chat_room_id=chat_room_id, user_id=user_id)
        db.add(db_chat_member)
        await db.commit()
        await db.refresh(db_chat_member)
        logger.info(f"User {user_id} added to chat room {chat_room_id}.")
        return db_chat_member

    async def remove_member(self, db: AsyncSession, chat_room_id: int, user_id: int) -> bool:
        """
        Removes a user from a chat room.

        Args:
            db (AsyncSession): The asynchronous database session.
            chat_room_id (int): The ID of the chat room.
            user_id (int): The ID of the user to remove.

        Returns:
            bool: True if the member was removed, False otherwise.
        """
        member = await db.execute(
            select(ChatRoomMember)
            .filter(ChatRoomMember.chat_room_id == chat_room_id, ChatRoomMember.user_id == user_id)
        )
        db_member = member.scalars().first()
        if db_member:
            await db.delete(db_member)
            await db.commit()
            logger.info(f"User {user_id} removed from chat room {chat_room_id}.")
            return True
        logger.warning(f"User {user_id} was not a member of chat room {chat_room_id}.")
        return False

    async def is_member(self, db: AsyncSession, chat_room_id: int, user_id: int) -> bool:
        """
        Checks if a user is a member of a given chat room.

        Args:
            db (AsyncSession): The asynchronous database session.
            chat_room_id (int): The ID of the chat room.
            user_id (int): The ID of the user.

        Returns:
            bool: True if the user is a member, False otherwise.
        """
        result = await db.execute(
            select(ChatRoomMember)
            .filter(ChatRoomMember.chat_room_id == chat_room_id, ChatRoomMember.user_id == user_id)
        )
        return result.scalars().first() is not None


class CRUDMessage(CRUDBase[Message, MessageCreate, MessageCreate]): # MessageCreate for update is a simplification
    """
    CRUD operations for Message model.
    """
    async def create_message(self, db: AsyncSession, *, chat_room_id: int, sender_id: int, content: str) -> Message:
        """
        Creates a new message in a chat room.

        Args:
            db (AsyncSession): The asynchronous database session.
            chat_room_id (int): The ID of the chat room.
            sender_id (int): The ID of the user sending the message.
            content (str): The content of the message.

        Returns:
            Message: The newly created message instance.
        """
        db_obj = Message(chat_room_id=chat_room_id, sender_id=sender_id, content=content)
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        # Refresh sender relationship to load it for the schema conversion
        await db.refresh(db_obj, attribute_names=['sender'])
        logger.info(f"Message sent by user {sender_id} in chat {chat_room_id}.")
        return db_obj

    async def get_messages_for_chat_room(
        self, db: AsyncSession, chat_room_id: int, skip: int = 0, limit: int = 50
    ) -> List[Message]:
        """
        Retrieves messages for a specific chat room with pagination.

        Args:
            db (AsyncSession): The asynchronous database session.
            chat_room_id (int): The ID of the chat room.
            skip (int): Number of messages to skip.
            limit (int): Maximum number of messages to return.

        Returns:
            List[Message]: A list of messages.
        """
        result = await db.execute(
            select(Message)
            .filter(Message.chat_room_id == chat_room_id)
            .options(joinedload(Message.sender)) # Eager load sender details
            .order_by(Message.created_at.asc()) # Ascending for chat history
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())


chat_room = CRUDChatRoom(ChatRoom)
message = CRUDMessage(Message)

```