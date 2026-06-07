```python
import pytest
import json
from httpx import AsyncClient
from fastapi import status

from app.core.config import settings
from app.core.websocket_manager import websocket_manager
from app.models.chat import ChatRoom, Message
from app.schemas.message import Message as MessageSchema # For validation in websocket test

@pytest.mark.asyncio
async def test_read_user_chat_rooms(client: AsyncClient, normal_user_token, normal_user, chat_room_with_two_members):
    """
    Test fetching chat rooms for an authenticated user.
    """
    response = await client.get(
        f"{settings.API_V1_STR}/chats/",
        headers={"Authorization": f"Bearer {normal_user_token}"}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["id"] == chat_room_with_two_members.id
    assert data[0]["name"] == chat_room_with_two_members.name


@pytest.mark.asyncio
async def test_create_chat_room(client: AsyncClient, normal_user_token, normal_user, test_db_session):
    """
    Test creating a new chat room.
    """
    chat_data = {"name": "New Chat Room"}
    response = await client.post(
        f"{settings.API_V1_STR}/chats/",
        json=chat_data,
        headers={"Authorization": f"Bearer {normal_user_token}"}
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["name"] == "New Chat Room"
    assert "id" in data
    assert any(member["id"] == normal_user.id for member in data["members"]) # Creator should be a member


@pytest.mark.asyncio
async def test_read_chat_room_details_authorized(client: AsyncClient, normal_user_token, chat_room_with_two_members):
    """
    Test fetching details of a chat room by ID when authorized.
    """
    response = await client.get(
        f"{settings.API_V1_STR}/chats/{chat_room_with_two_members.id}",
        headers={"Authorization": f"Bearer {normal_user_token}"}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == chat_room_with_two_members.id
    assert data["name"] == chat_room_with_two_members.name
    assert len(data["members"]) == 2 # normal_user and admin_user
    assert "messages" in data # Even if empty, the key should exist


@pytest.mark.asyncio
async def test_read_chat_room_details_unauthorized(client: AsyncClient, admin_user_token, create_test_chat_room, normal_user):
    """
    Test fetching details of a chat room by ID when unauthorized (not a member).
    """
    # Create a chat room where admin_user is NOT a member
    unauthorized_chat_room = await create_test_chat_room(name="Private Room", creator_id=normal_user.id)

    response = await client.get(
        f"{settings.API_V1_STR}/chats/{unauthorized_chat_room.id}",
        headers={"Authorization": f"Bearer {admin_user_token}"}
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert "User is not a member of this chat room" in response.json()["detail"]


@pytest.mark.asyncio
async def test_update_chat_room_authorized(client: AsyncClient, normal_user_token, chat_room_with_two_members, normal_user):
    """
    Test updating a chat room's name when authorized.
    """
    update_data = {"name": "Updated Chat Name"}
    response = await client.put(
        f"{settings.API_V1_STR}/chats/{chat_room_with_two_members.id}",
        json=update_data,
        headers={"Authorization": f"Bearer {normal_user_token}"}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["name"] == "Updated Chat Name"
    assert data["id"] == chat_room_with_two_members.id
    assert any(member["id"] == normal_user.id for member in data["members"])


@pytest.mark.asyncio
async def test_delete_chat_room_authorized(client: AsyncClient, normal_user_token, create_test_chat_room, normal_user):
    """
    Test deleting a chat room when authorized.
    """
    chat_room_to_delete = await create_test_chat_room(name="Temp Room", creator_id=normal_user.id)
    response = await client.delete(
        f"{settings.API_V1_STR}/chats/{chat_room_to_delete.id}",
        headers={"Authorization": f"Bearer {normal_user_token}"}
    )
    assert response.status_code == status.HTTP_204_NO_CONTENT

    # Verify it's deleted
    response_get = await client.get(
        f"{settings.API_V1_STR}/chats/{chat_room_to_delete.id}",
        headers={"Authorization": f"Bearer {normal_user_token}"}
    )
    assert response_get.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.asyncio
async def test_add_chat_member(client: AsyncClient, normal_user_token, chat_room_with_two_members, test_db_session, create_test_user):
    """
    Test adding a user to a chat room.
    """
    new_member = await create_test_user(username="newmember", email="newmember@example.com")

    response = await client.post(
        f"{settings.API_V1_STR}/chats/{chat_room_with_two_members.id}/members/{new_member.id}",
        headers={"Authorization": f"Bearer {normal_user_token}"}
    )
    assert response.status_code == status.HTTP_200_OK
    assert "User added to chat room successfully" in response.json()["message"]

    # Verify new member is in the chat
    response_get = await client.get(
        f"{settings.API_V1_STR}/chats/{chat_room_with_two_members.id}",
        headers={"Authorization": f"Bearer {normal_user_token}"}
    )
    data = response_get.json()
    assert len(data["members"]) == 3
    assert any(member["id"] == new_member.id for member in data["members"])


@pytest.mark.asyncio
async def test_remove_chat_member(client: AsyncClient, normal_user_token, chat_room_with_two_members, admin_user):
    """
    Test removing a user from a chat room.
    """
    response = await client.delete(
        f"{settings.API_V1_STR}/chats/{chat_room_with_two_members.id}/members/{admin_user.id}",
        headers={"Authorization": f"Bearer {normal_user_token}"}
    )
    assert response.status_code == status.HTTP_200_OK
    assert "User removed from chat room successfully" in response.json()["message"]

    # Verify member is removed
    response_get = await client.get(
        f"{settings.API_V1_STR}/chats/{chat_room_with_two_members.id}",
        headers={"Authorization": f"Bearer {normal_user_token}"}
    )
    data = response_get.json()
    assert len(data["members"]) == 1 # Only normal_user should remain
    assert not any(member["id"] == admin_user.id for member in data["members"])


@pytest.mark.asyncio
async def test_send_message(client: AsyncClient, normal_user_token, chat_room_with_two_members, normal_user):
    """
    Test sending a message to a chat room.
    """
    message_data = {"content": "Test message from API"}
    response = await client.post(
        f"{settings.API_V1_STR}/chats/{chat_room_with_two_members.id}/messages",
        json=message_data,
        headers={"Authorization": f"Bearer {normal_user_token}"}
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["content"] == "Test message from API"
    assert data["sender"]["id"] == normal_user.id
    assert data["chat_room_id"] == chat_room_with_two_members.id


@pytest.mark.asyncio
async def test_get_chat_room_messages(client: AsyncClient, normal_user_token, chat_room_with_two_members, populate_chat_messages):
    """
    Test retrieving messages from a chat room.
    """
    response = await client.get(
        f"{settings.API_V1_STR}/chats/{chat_room_with_two_members.id}/messages",
        headers={"Authorization": f"Bearer {normal_user_token}"}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 3 # 3 messages populated by fixture
    assert data[0]["content"] == "Hi there from normal user!"
    assert data[1]["content"] == "Admin checking in."


@pytest.mark.asyncio
async def test_websocket_connection_and_message_broadcast(client: AsyncClient, normal_user, normal_user_token, chat_room_with_two_members, test_db_session):
    """
    Test WebSocket connection, initial auth, and message broadcasting.
    """
    # Simulate a client connecting to the websocket
    async with client.websocket_connect(
        f"{settings.API_V1_STR}/chats/{chat_room_with_two_members.id}/ws"
    ) as websocket:
        # First, send the auth token
        await websocket.send_json({"auth_token": normal_user_token})
        
        # Now, send a message
        message_content = "Hello from WebSocket client!"
        await websocket.send_json({"content": message_content})

        # The message should be broadcast back to all connected clients (including sender)
        # We should receive our own message back
        received_message_str = await websocket.receive_text()
        received_message_data = json.loads(received_message_str)
        
        # Validate the received message against the schema
        message_schema = MessageSchema(**received_message_data)

        assert message_schema.content == message_content
        assert message_schema.sender.id == normal_user.id
        assert message_schema.chat_room_id == chat_room_with_two_members.id
        assert "id" in received_message_data
        assert "created_at" in received_message_data
        
        # Verify message was also saved to DB
        from app.crud.chat import message as crud_message
        db_messages = await crud_message.get_messages_for_chat_room(test_db_session, chat_room_with_two_members.id)
        assert any(msg.content == message_content for msg in db_messages)

        # Disconnect explicitly for cleaner test
        await websocket.close()

    # Ensure WebSocketManager correctly handles disconnect
    assert chat_room_with_two_members.id not in websocket_manager.active_connections or \
           normal_user.id not in websocket_manager.active_connections[chat_room_with_two_members.id]


@pytest.mark.asyncio
async def test_websocket_unauthenticated_connection(client: AsyncClient, chat_room_with_two_members):
    """
    Test WebSocket connection without authentication.
    """
    with pytest.raises(Exception): # WebSocketConnect will raise an exception if handshake fails
        async with client.websocket_connect(
            f"{settings.API_V1_STR}/chats/{chat_room_with_two_members.id}/ws"
        ) as websocket:
            # Try to send a message without initial auth
            await websocket.send_json({"content": "This should fail"})
            # The server should close the connection before receiving this
            await websocket.receive_text() # This should fail or receive close signal


@pytest.mark.asyncio
async def test_websocket_unauthorized_chat_room(client: AsyncClient, normal_user_token, create_test_chat_room, admin_user):
    """
    Test WebSocket connection to a chat room the user is not a member of.
    """
    # Create a chat room where normal_user is NOT a member
    unauthorized_chat_room = await create_test_chat_room(name="Admin Only Room", creator_id=admin_user.id)

    with pytest.raises(Exception): # WebSocketConnect will raise an exception if handshake fails
        async with client.websocket_connect(
            f"{settings.API_V1_STR}/chats/{unauthorized_chat_room.id}/ws"
        ) as websocket:
            await websocket.send_json({"auth_token": normal_user_token})
            await websocket.receive_text() # Expect server to close connection
```