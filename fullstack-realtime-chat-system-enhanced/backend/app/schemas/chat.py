```python
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from app.schemas.user import User
from app.schemas.message import Message  # Import Message schema for relationship


# Schema for Chat Room creation
class ChatRoomCreate(BaseModel):
    """
    Pydantic schema for creating a new chat room.
    """
    name: str = Field(..., min_length=1, max_length=100, description="Name of the chat room")
    # For simplicity, members are added separately after creation or via a dedicated endpoint.
    # In a more complex system, initial members could be passed here.


# Schema for Chat Room updates
class ChatRoomUpdate(BaseModel):
    """
    Pydantic schema for updating an existing chat room.
    """
    name: Optional[str] = Field(None, min_length=1, max_length=100, description="New name for the chat room")


# Schema for Chat Room Member (join/leave)
class ChatRoomMemberSchema(BaseModel):
    """
    Pydantic schema for a chat room member relationship.
    """
    user_id: int = Field(..., description="ID of the user who is a member")
    chat_room_id: int = Field(..., description="ID of the chat room")

    class Config:
        from_attributes = True


# Base schema for Chat Room (for properties common to response models)
class ChatRoomBase(BaseModel):
    """
    Base Pydantic schema for chat room properties as stored in the database.
    """
    id: int = Field(..., description="Unique identifier for the chat room")
    name: str = Field(..., description="Name of the chat room")
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Full Chat Room response schema including members and messages
class ChatRoom(ChatRoomBase):
    """
    Full Pydantic schema for a chat room, including its members and messages.
    Used for detailed chat room responses.
    """
    members: List[User] = Field([], description="List of users who are members of this chat room")
    messages: List[Message] = Field([], description="List of messages in this chat room") # Limited number usually in UI


# Schema for a chat room in a list context (less detail)
class ChatRoomInList(ChatRoomBase):
    """
    Pydantic schema for a chat room when displayed in a list,
    typically without full member or message details for performance.
    """
    # Potentially add a count of members, or last message preview
    pass
```