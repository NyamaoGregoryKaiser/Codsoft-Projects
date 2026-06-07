```python
from sqlalchemy import Column, Integer, String, ForeignKey, UniqueConstraint, Text
from sqlalchemy.orm import relationship
from app.models.base import Base


class ChatRoom(Base):
    """
    SQLAlchemy model for a Chat Room.
    Represents a conversation space where users can send messages.
    """
    __tablename__ = "chat_rooms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    # A chat room could be public, private, or direct message.
    # For simplicity, we'll keep it simple as just a "room" for now.

    # Relationships
    # One-to-many relationship with messages (ChatRoom has many messages)
    messages = relationship("Message", back_populates="chat_room", lazy="joined", cascade="all, delete-orphan")
    # Many-to-many relationship with users via ChatRoomMember
    members = relationship("ChatRoomMember", back_populates="chat_room", lazy="joined", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<ChatRoom(id={self.id}, name='{self.name}')>"


class ChatRoomMember(Base):
    """
    SQLAlchemy model for the Many-to-Many relationship between User and ChatRoom.
    Indicates which users are members of which chat rooms.
    """
    __tablename__ = "chat_room_members"

    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    chat_room_id = Column(Integer, ForeignKey("chat_rooms.id"), primary_key=True)

    # Relationships
    member = relationship("User", back_populates="chat_memberships")
    chat_room = relationship("ChatRoom", back_populates="members")

    __table_args__ = (UniqueConstraint("user_id", "chat_room_id", name="uq_user_chat_room"),)

    def __repr__(self):
        return f"<ChatRoomMember(user_id={self.user_id}, chat_room_id={self.chat_room_id})>"


class Message(Base):
    """
    SQLAlchemy model for a Message.
    Represents a message sent by a user in a chat room.
    """
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    chat_room_id = Column(Integer, ForeignKey("chat_rooms.id"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)

    # Relationships
    sender = relationship("User", back_populates="messages", lazy="joined")
    chat_room = relationship("ChatRoom", back_populates="messages")

    def __repr__(self):
        return f"<Message(id={self.id}, chat_room_id={self.chat_room_id}, sender_id={self.sender_id})>"

```