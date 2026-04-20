from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from app.db.base import BaseModel

class User(BaseModel):
    __tablename__ = "users"

    id: int = Column(Integer, primary_key=True, index=True)
    email: str = Column(String, unique=True, index=True, nullable=False)
    hashed_password: str = Column(String, nullable=False)
    is_active: bool = Column(Boolean, default=True)
    is_superuser: bool = Column(Boolean, default=False)
    created_at: datetime = Column(DateTime, default=datetime.utcnow)
    updated_at: datetime = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship to Dashboards (one-to-many)
    # dashboards: Mapped[list["Dashboard"]] = relationship("Dashboard", back_populates="owner")
    # This requires `from sqlalchemy.orm import relationship, Mapped` and forward references,
    # which can be complex with circular imports. For simplicity now, we'll keep relationships basic.
    # With `AsyncAttrs` and `BaseModel` this is possible but requires more setup.
    # For now, we'll manage relationships via foreign keys in other models.

    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}')>"