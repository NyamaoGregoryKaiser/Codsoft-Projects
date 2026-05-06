```python
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from backend.models.base import Base
from sqlalchemy import func

class UserAgent(Base):
    __tablename__ = "user_agents"

    id = Column(Integer, primary_key=True, index=True)
    agent_string = Column(String, unique=True, nullable=False)
    enabled = Column(Boolean, default=True)
    last_used = Column(DateTime, server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<UserAgent(id={self.id}, agent='{self.agent_string[:30]}...', enabled={self.enabled})>"
```