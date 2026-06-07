```python
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

# We use an alias for User schema to avoid circular import issues
# The actual User schema will be imported and used within ChatRoom schema definition
# However, for a Message, we just need basic sender info, so a lighter User schema might be preferred,
# or just the ID and username. Let's use a nested schema for simplicity.
class MessageSender(BaseModel):
    id: int
    username: str

    class Config:
        from_attributes = True


class MessageBase(BaseModel):
    """
    Base Pydantic schema for message properties.
    """
    content: str = Field(..., min_length=1, description="Content of the message")


class MessageCreate(MessageBase):
    """
    Pydantic schema for creating a new message.
    """
    chat_room_id: int = Field(..., description="ID of the chat room where the message is sent")
    # sender_id is typically taken from the authenticated user, not provided by client


class MessageUpdate(MessageBase):
    """
    Pydantic schema for updating an existing message.
    Currently, messages are typically immutable in chat apps,
    but this provides a structure if editing messages is a feature.
    """
    content: Optional[str] = Field(None, min_length=1, description="New content for the message")


class Message(MessageBase):
    """
    Full Pydantic schema for a message, including database-generated fields and sender info.
    """
    id: int = Field(..., description="Unique identifier for the message")
    chat_room_id: int = Field(..., description="ID of the chat room the message belongs to")
    sender_id: int = Field(..., description="ID of the user who sent the message")
    sender: MessageSender # Nested schema for sender details
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

```