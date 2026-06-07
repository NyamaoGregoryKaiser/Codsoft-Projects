```python
from sqlalchemy import Boolean, Column, Integer, String
from sqlalchemy.orm import relationship

from app.models.base import Base


class User(Base):
    """
    SQLAlchemy model for a User.
    Represents users in the chat application.
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)

    # Relationships
    # One-to-many relationship with messages (User sends many messages)
    messages = relationship("Message", back_populates="sender", lazy="joined", cascade="all, delete-orphan")
    # Many-to-many relationship with chat rooms via ChatRoomMember
    chat_memberships = relationship("ChatRoomMember", back_populates="member", lazy="joined", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}', email='{self.email}')>"

```