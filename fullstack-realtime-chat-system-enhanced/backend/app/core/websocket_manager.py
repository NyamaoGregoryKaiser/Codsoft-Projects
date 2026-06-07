```python
import logging
from typing import Dict, List, Set

from fastapi import WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)

class WebSocketManager:
    """
    Manages active WebSocket connections for chat rooms.
    Allows connecting, disconnecting, and broadcasting messages to specific chat rooms.
    """
    def __init__(self):
        # Stores active connections: {chat_id: {user_id: WebSocket}}
        self.active_connections: Dict[int, Dict[int, WebSocket]] = {}
        logger.info("WebSocketManager initialized.")

    async def connect(self, chat_id: int, user_id: int, websocket: WebSocket):
        """
        Establishes a new WebSocket connection for a given user in a specific chat room.

        Args:
            chat_id (int): The ID of the chat room.
            user_id (int): The ID of the connecting user.
            websocket (WebSocket): The WebSocket object for the connection.
        """
        await websocket.accept()
        if chat_id not in self.active_connections:
            self.active_connections[chat_id] = {}
        self.active_connections[chat_id][user_id] = websocket
        logger.info(f"User {user_id} connected to chat {chat_id}. Total connections for chat {chat_id}: {len(self.active_connections[chat_id])}")

    def disconnect(self, chat_id: int, user_id: int):
        """
        Removes a WebSocket connection.

        Args:
            chat_id (int): The ID of the chat room.
            user_id (int): The ID of the disconnecting user.
        """
        if chat_id in self.active_connections and user_id in self.active_connections[chat_id]:
            del self.active_connections[chat_id][user_id]
            if not self.active_connections[chat_id]:
                del self.active_connections[chat_id]
            logger.info(f"User {user_id} disconnected from chat {chat_id}.")
        else:
            logger.warning(f"Attempted to disconnect non-existent user {user_id} from chat {chat_id}.")

    async def send_personal_message(self, chat_id: int, user_id: int, message: str):
        """
        Sends a message to a specific user in a specific chat room.

        Args:
            chat_id (int): The ID of the chat room.
            user_id (int): The ID of the target user.
            message (str): The message content to send.
        """
        if chat_id in self.active_connections and user_id in self.active_connections[chat_id]:
            websocket = self.active_connections[chat_id][user_id]
            try:
                await websocket.send_text(message)
                logger.debug(f"Sent message to user {user_id} in chat {chat_id}.")
            except RuntimeError as e: # Handle WebSocket connection closure during send
                logger.warning(f"Failed to send message to user {user_id} in chat {chat_id}: {e}. Disconnecting user.")
                self.disconnect(chat_id, user_id)
            except Exception as e:
                logger.error(f"Error sending message to user {user_id} in chat {chat_id}: {e}")
        else:
            logger.warning(f"User {user_id} not connected to chat {chat_id}. Cannot send personal message.")

    async def broadcast(self, chat_id: int, message: str):
        """
        Broadcasts a message to all active connections in a specific chat room.

        Args:
            chat_id (int): The ID of the chat room.
            message (str): The message content to broadcast.
        """
        if chat_id in self.active_connections:
            disconnected_users = []
            for user_id, connection in list(self.active_connections[chat_id].items()):
                try:
                    await connection.send_text(message)
                except RuntimeError as e:
                    logger.warning(f"Failed to broadcast to user {user_id} in chat {chat_id}: {e}. Marking for disconnect.")
                    disconnected_users.append(user_id)
                except WebSocketDisconnect:
                    logger.warning(f"User {user_id} disconnected from chat {chat_id} during broadcast. Marking for disconnect.")
                    disconnected_users.append(user_id)
                except Exception as e:
                    logger.error(f"Error broadcasting to user {user_id} in chat {chat_id}: {e}")

            # Clean up disconnected users after iterating
            for user_id in disconnected_users:
                self.disconnect(chat_id, user_id)
            logger.info(f"Broadcasted message to chat {chat_id}. Users online: {len(self.active_connections[chat_id]) if chat_id in self.active_connections else 0}")
        else:
            logger.warning(f"No active connections for chat {chat_id} to broadcast message.")

# Global instance of WebSocketManager
# This will be injected into endpoints via `Depends` if needed, or accessed directly.
# For simplicity and direct use in `main.py` and chat endpoints, we create it here.
# For multi-instance deployments, this would be replaced with a distributed pub/sub
# mechanism (e.g., Redis Pub/Sub, Kafka) where each instance broadcasts locally and
# also publishes to the central topic.
websocket_manager = WebSocketManager()

```