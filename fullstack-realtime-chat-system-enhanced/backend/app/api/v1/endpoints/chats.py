```python
import json
import logging
from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies.auth import get_current_active_user
from app.core.database import get_db_session
from app.core.websocket_manager import websocket_manager
from app.models.user import User
from app.schemas.chat import ChatRoomCreate, ChatRoomUpdate, ChatRoom, ChatRoomInList
from app.schemas.message import MessageCreate, Message
from app.services.chat_service import chat_service

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/", response_model=List[ChatRoomInList], summary="Get chat rooms for current user")
async def read_user_chat_rooms(
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Retrieve all chat rooms that the current authenticated user is a member of.
    """
    chat_rooms = await chat_service.get_user_chat_rooms(db, current_user.id)
    # Convert ChatRoom models to ChatRoomInList schemas
    return [
        ChatRoomInList.model_validate(
            room,
            # No need to manually convert members/messages if ChatRoomInList doesn't expect them
            # For ChatRoomInList, we might want to attach a 'last_message' or 'unread_count' later
            # For now, just basic room info.
        ) for room in chat_rooms
    ]


@router.post("/", response_model=ChatRoom, status_code=status.HTTP_201_CREATED, summary="Create a new chat room")
async def create_new_chat_room(
    chat_room_in: ChatRoomCreate,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Create a new chat room. The creator is automatically added as a member.
    """
    chat_room = await chat_service.create_chat_room(db, chat_room_in, current_user.id)
    # After creation, load members to serialize correctly
    chat_room_with_details = await chat_service.get_chat_room_details(db, chat_room.id, current_user.id)
    return chat_room_with_details


@router.get("/{chat_room_id}", response_model=ChatRoom, summary="Get details of a specific chat room")
async def read_chat_room_details(
    chat_room_id: int,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Retrieve details of a specific chat room, including its members and recent messages.
    User must be a member of the chat room.
    """
    chat_room = await chat_service.get_chat_room_details(db, chat_room_id, current_user.id)
    return chat_room


@router.put("/{chat_room_id}", response_model=ChatRoom, summary="Update a chat room (Members only)")
async def update_existing_chat_room(
    chat_room_id: int,
    chat_room_in: ChatRoomUpdate,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Update a chat room's properties.
    User must be a member of the chat room. (More granular permissions can be added later, e.g., admin/owner only)
    """
    # First, check if the current user is a member
    is_member = await chat_service.get_chat_room_details(db, chat_room_id, current_user.id) # This call implicitly checks membership
    
    updated_chat_room = await chat_service.update_chat_room(db, chat_room_id, chat_room_in)
    # Reload with full details for response
    chat_room_with_details = await chat_service.get_chat_room_details(db, updated_chat_room.id, current_user.id)
    return chat_room_with_details


@router.delete("/{chat_room_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a chat room (Admin/Owner only)")
async def delete_existing_chat_room(
    chat_room_id: int,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user) # For now, any member can delete, improve this later
) -> None:
    """
    Delete a chat room. Requires appropriate permissions (e.g., admin or owner).
    Currently, only checks if user is a member, more robust checks needed for production.
    """
    # Implement more robust authorization here: e.g., only creator or admin can delete
    # For now, just check if user is a member.
    await chat_service.get_chat_room_details(db, chat_room_id, current_user.id) # This call implicitly checks membership
    
    await chat_service.delete_chat_room(db, chat_room_id)
    logger.info(f"Chat room {chat_room_id} deleted by user {current_user.id}.")
    return {"message": "Chat room deleted successfully"}


@router.post("/{chat_room_id}/members/{user_id}", status_code=status.HTTP_200_OK, summary="Add a user to a chat room")
async def add_chat_member(
    chat_room_id: int,
    user_id: int,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Add a user to an existing chat room.
    User performing the action must be a member of the chat room. (Further permission checks can be added)
    """
    # Check if current_user is a member of the chat_room
    await chat_service.get_chat_room_details(db, chat_room_id, current_user.id)
    
    await chat_service.add_chat_room_member(db, chat_room_id, user_id)
    logger.info(f"User {user_id} added to chat room {chat_room_id} by {current_user.id}.")
    return {"message": "User added to chat room successfully"}


@router.delete("/{chat_room_id}/members/{user_id}", status_code=status.HTTP_200_OK, summary="Remove a user from a chat room")
async def remove_chat_member(
    chat_room_id: int,
    user_id: int,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Remove a user from an existing chat room.
    User performing the action must be a member of the chat room. (Further permission checks can be added)
    """
    # Check if current_user is a member of the chat_room
    await chat_service.get_chat_room_details(db, chat_room_id, current_user.id)

    # Prevent a user from removing themselves via this endpoint (should be a leave endpoint)
    if current_user.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove yourself from a chat room using this endpoint. Use a 'leave' endpoint if available."
        )

    await chat_service.remove_chat_room_member(db, chat_room_id, user_id)
    logger.info(f"User {user_id} removed from chat room {chat_room_id} by {current_user.id}.")
    return {"message": "User removed from chat room successfully"}


@router.post("/{chat_room_id}/messages", response_model=Message, status_code=status.HTTP_201_CREATED, summary="Send a message to a chat room")
async def send_new_message(
    chat_room_id: int,
    message_in: MessageCreate,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Send a new message to a specific chat room.
    User must be a member of the chat room.
    """
    message_in.chat_room_id = chat_room_id # Ensure chat_room_id from path is used
    new_message_db = await chat_service.send_message(db, message_in, current_user.id)
    
    # Broadcast the message via WebSocket
    # We need to serialize the message DB object into a Pydantic schema for broadcasting
    message_schema = Message.model_validate(new_message_db)
    await websocket_manager.broadcast(chat_room_id, json.dumps(message_schema.model_dump()))
    
    logger.info(f"User {current_user.id} sent message in chat {chat_room_id}.")
    return message_schema


@router.get("/{chat_room_id}/messages", response_model=List[Message], summary="Get messages from a chat room")
async def get_chat_room_messages(
    chat_room_id: int,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user),
    skip: int = 0,
    limit: int = 50
) -> Any:
    """
    Retrieve messages from a specific chat room.
    User must be a member of the chat room.
    """
    messages = await chat_service.get_messages_for_chat_room(db, chat_room_id, current_user.id, skip, limit)
    return messages


@router.websocket("/{chat_room_id}/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    chat_room_id: int,
    token: str, # Passed as a query parameter or path parameter for WebSocket
    db: AsyncSession = Depends(get_db_session) # Can't use Depends directly, must create session
):
    """
    WebSocket endpoint for real-time chat.
    Authenticates user via token, verifies membership, then handles message sending/receiving.
    """
    current_user: Optional[User] = None
    try:
        # Authenticate the user from the token
        payload = await websocket.receive_json() # First message should contain token in 'auth' field
        auth_token = payload.get("auth_token")
        if not auth_token:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No authentication token provided")

        # Reuse get_current_user logic for token validation
        # Cannot use Depends directly, so manually get db session and call crud
        token_payload = await get_db_session().__anext__() # Simulate Depends(get_db_session)
        
        user_payload = await get_current_active_user(db=token_payload, token=auth_token)
        current_user = user_payload
        
        await token_payload.close() # Close the temporary session

    except (HTTPException, WebSocketDisconnect, json.JSONDecodeError) as e:
        logger.error(f"WebSocket authentication failed for chat {chat_room_id}: {e}")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    except Exception as e:
        logger.error(f"Unexpected error during WebSocket authentication for chat {chat_room_id}: {e}")
        await websocket.close(code=status.WS_1011_INTERNAL_ERROR)
        return

    if not current_user:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Authentication failed.")
        return

    # Verify if the authenticated user is a member of the chat room
    try:
        # Need a new session for actual chat_service operations
        async for session in get_db_session():
            is_member = await chat_service.get_chat_room_details(session, chat_room_id, current_user.id) # Implicitly checks membership
        # The above call will raise HTTPException if not found or not member, caught below
    except HTTPException as e:
        logger.warning(f"User {current_user.id} not authorized for chat room {chat_room_id}. Detail: {e.detail}")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Not authorized for this chat room.")
        return
    except Exception as e:
        logger.error(f"Error checking chat room membership for user {current_user.id} in chat {chat_room_id}: {e}")
        await websocket.close(code=status.WS_1011_INTERNAL_ERROR, reason="Server error during membership check.")
        return
        
    # --- If authentication and authorization are successful ---
    await websocket_manager.connect(chat_room_id, current_user.id, websocket)
    logger.info(f"User {current_user.username} (ID: {current_user.id}) connected to WebSocket for chat {chat_room_id}.")

    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            content = message_data.get("content")

            if content:
                async for session in get_db_session():
                    message_in = MessageCreate(chat_room_id=chat_room_id, content=content)
                    new_message_db = await chat_service.send_message(session, message_in, current_user.id)
                    
                    # Serialize the message DB object into a Pydantic schema for broadcasting
                    message_schema = Message.model_validate(new_message_db)
                    
                    await websocket_manager.broadcast(chat_room_id, json.dumps(message_schema.model_dump()))
                    logger.info(f"User {current_user.id} sent message in chat {chat_room_id}: {content[:50]}...")
            else:
                logger.warning(f"Received empty message from user {current_user.id} in chat {chat_room_id}.")

    except WebSocketDisconnect:
        logger.info(f"User {current_user.id} disconnected from WebSocket for chat {chat_room_id}.")
    except json.JSONDecodeError:
        logger.warning(f"Invalid JSON received from user {current_user.id} in chat {chat_room_id}.")
        await websocket.send_json({"error": "Invalid JSON format."})
    except Exception as e:
        logger.error(f"WebSocket error for user {current_user.id} in chat {chat_room_id}: {e}", exc_info=True)
        await websocket.send_json({"error": f"An unexpected error occurred: {e}"})
    finally:
        websocket_manager.disconnect(chat_room_id, current_user.id)
        logger.debug(f"User {current_user.id} removed from WebSocket manager for chat {chat_room_id}.")

```