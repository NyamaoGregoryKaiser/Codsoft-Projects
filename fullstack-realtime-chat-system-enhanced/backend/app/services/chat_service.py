```python
import logging
from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.chat import chat_room as crud_chat_room, message as crud_message
from app.crud.user import user as crud_user
from app.models.chat import ChatRoom, Message
from app.models.user import User
from app.schemas.chat import ChatRoomCreate, ChatRoomUpdate
from app.schemas.message import MessageCreate, Message as MessageSchema

logger = logging.getLogger(__name__)

class ChatService:
    """
    Service layer for chat-related business logic.
    Handles chat room creation, management, messaging, and member operations.
    """

    async def create_chat_room(self, db: AsyncSession, chat_room_in: ChatRoomCreate, creator_id: int) -> ChatRoom:
        """
        Creates a new chat room and adds the creator as its first member.

        Args:
            db (AsyncSession): The asynchronous database session.
            chat_room_in (ChatRoomCreate): Pydantic schema for chat room creation.
            creator_id (int): The ID of the user creating the chat room.

        Returns:
            ChatRoom: The newly created chat room object.

        Raises:
            HTTPException: If the creator user does not exist.
        """
        creator = await crud_user.get(db, creator_id)
        if not creator:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Creator user not found."
            )

        new_chat_room = await crud_chat_room.create(db, obj_in=chat_room_in)
        await crud_chat_room.add_member(db, chat_room_id=new_chat_room.id, user_id=creator_id)

        logger.info(f"Chat room '{new_chat_room.name}' created by user {creator_id} (ID: {new_chat_room.id}).")
        return new_chat_room

    async def get_user_chat_rooms(self, db: AsyncSession, user_id: int) -> List[ChatRoom]:
        """
        Retrieves all chat rooms a user is a member of.

        Args:
            db (AsyncSession): The asynchronous database session.
            user_id (int): The ID of the user.

        Returns:
            List[ChatRoom]: A list of chat rooms.
        """
        chat_rooms = await crud_chat_room.get_user_chat_rooms(db, user_id)
        # Potentially filter messages for only the latest N messages per chat here
        for chat_room in chat_rooms:
            # Sort messages by created_at and take the last N (e.g., 20)
            chat_room.messages.sort(key=lambda msg: msg.created_at)
            chat_room.messages = chat_room.messages[-20:] # Limit to last 20 messages for list view

            # Extract actual User objects from ChatRoomMember for schema conversion
            chat_room.members = [member.member for member in chat_room.members] # type: ignore
        logger.info(f"Retrieved {len(chat_rooms)} chat rooms for user {user_id}.")
        return chat_rooms

    async def get_chat_room_details(self, db: AsyncSession, chat_room_id: int, user_id: int) -> ChatRoom:
        """
        Retrieves details of a specific chat room, including members and messages,
        but only if the requesting user is a member.

        Args:
            db (AsyncSession): The asynchronous database session.
            chat_room_id (int): The ID of the chat room.
            user_id (int): The ID of the requesting user.

        Returns:
            ChatRoom: The detailed chat room object.

        Raises:
            HTTPException: If the chat room is not found or the user is not a member.
        """
        chat_room = await crud_chat_room.get_with_details(db, chat_room_id)
        if not chat_room:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat room not found.")

        # Check if user is a member
        is_user_member = any(member.user_id == user_id for member in chat_room.members) # type: ignore
        if not is_user_member:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is not a member of this chat room.")

        # Ensure members are actual User objects for schema serialization
        chat_room.members = [member.member for member in chat_room.members] # type: ignore
        # Sort messages by created_at
        chat_room.messages.sort(key=lambda msg: msg.created_at)

        logger.info(f"Retrieved details for chat room {chat_room_id} for user {user_id}.")
        return chat_room

    async def update_chat_room(self, db: AsyncSession, chat_room_id: int, chat_room_in: ChatRoomUpdate) -> ChatRoom:
        """
        Updates an existing chat room.

        Args:
            db (AsyncSession): The asynchronous database session.
            chat_room_id (int): The ID of the chat room to update.
            chat_room_in (ChatRoomUpdate): Pydantic schema with update data.

        Returns:
            ChatRoom: The updated chat room object.

        Raises:
            HTTPException: If the chat room is not found.
        """
        chat_room = await crud_chat_room.get(db, chat_room_id)
        if not chat_room:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat room not found.")

        updated_chat_room = await crud_chat_room.update(db, db_obj=chat_room, obj_in=chat_room_in)
        logger.info(f"Chat room {chat_room_id} updated.")
        return updated_chat_room

    async def delete_chat_room(self, db: AsyncSession, chat_room_id: int) -> ChatRoom:
        """
        Deletes a chat room.

        Args:
            db (AsyncSession): The asynchronous database session.
            chat_room_id (int): The ID of the chat room to delete.

        Returns:
            ChatRoom: The deleted chat room object.

        Raises:
            HTTPException: If the chat room is not found.
        """
        chat_room = await crud_chat_room.remove(db, id=chat_room_id)
        if not chat_room:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat room not found.")
        logger.info(f"Chat room {chat_room_id} deleted.")
        return chat_room

    async def add_chat_room_member(self, db: AsyncSession, chat_room_id: int, user_id: int) -> None:
        """
        Adds a user to a chat room.

        Args:
            db (AsyncSession): The asynchronous database session.
            chat_room_id (int): The ID of the chat room.
            user_id (int): The ID of the user to add.

        Raises:
            HTTPException: If chat room or user not found, or user is already a member.
        """
        chat_room = await crud_chat_room.get(db, chat_room_id)
        if not chat_room:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat room not found.")

        user = await crud_user.get(db, user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

        member = await crud_chat_room.add_member(db, chat_room_id, user_id)
        if not member:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User is already a member of this chat room.")
        logger.info(f"User {user_id} added to chat room {chat_room_id}.")

    async def remove_chat_room_member(self, db: AsyncSession, chat_room_id: int, user_id: int) -> None:
        """
        Removes a user from a chat room.

        Args:
            db (AsyncSession): The asynchronous database session.
            chat_room_id (int): The ID of the chat room.
            user_id (int): The ID of the user to remove.

        Raises:
            HTTPException: If chat room or user not found, or user is not a member.
        """
        chat_room = await crud_chat_room.get(db, chat_room_id)
        if not chat_room:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat room not found.")

        user = await crud_user.get(db, user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

        if not await crud_chat_room.remove_member(db, chat_room_id, user_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User is not a member of this chat room.")
        logger.info(f"User {user_id} removed from chat room {chat_room_id}.")


    async def send_message(self, db: AsyncSession, message_in: MessageCreate, sender_id: int) -> Message:
        """
        Sends a new message in a chat room.

        Args:
            db (AsyncSession): The asynchronous database session.
            message_in (MessageCreate): Pydantic schema for message creation.
            sender_id (int): The ID of the user sending the message.

        Returns:
            Message: The newly created message object.

        Raises:
            HTTPException: If chat room not found or sender is not a member.
        """
        chat_room_id = message_in.chat_room_id
        chat_room = await crud_chat_room.get(db, chat_room_id)
        if not chat_room:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat room not found.")

        is_member = await crud_chat_room.is_member(db, chat_room_id, sender_id)
        if not is_member:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not a member of this chat room.")

        new_message = await crud_message.create_message(
            db, chat_room_id=chat_room_id, sender_id=sender_id, content=message_in.content
        )
        logger.info(f"Message sent in chat {chat_room_id} by user {sender_id}.")
        return new_message

    async def get_messages_for_chat_room(self, db: AsyncSession, chat_room_id: int, user_id: int, skip: int = 0, limit: int = 50) -> List[Message]:
        """
        Retrieves messages for a specific chat room, ensuring the user is a member.

        Args:
            db (AsyncSession): The asynchronous database session.
            chat_room_id (int): The ID of the chat room.
            user_id (int): The ID of the requesting user.
            skip (int): Offset for pagination.
            limit (int): Limit for pagination.

        Returns:
            List[Message]: A list of message objects.

        Raises:
            HTTPException: If chat room not found or user is not a member.
        """
        chat_room = await crud_chat_room.get(db, chat_room_id)
        if not chat_room:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat room not found.")

        is_member = await crud_chat_room.is_member(db, chat_room_id, user_id)
        if not is_member:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not a member of this chat room.")

        messages = await crud_message.get_messages_for_chat_room(db, chat_room_id, skip=skip, limit=limit)
        logger.debug(f"Retrieved {len(messages)} messages for chat {chat_room_id}.")
        return messages

    async def get_all_users(self, db: AsyncSession) -> List[User]:
        """
        Retrieves all users in the system.

        Args:
            db (AsyncSession): The asynchronous database session.

        Returns:
            List[User]: A list of all user objects.
        """
        users = await crud_user.get_multi(db, limit=1000) # Arbitrary limit
        return users


chat_service = ChatService()

```