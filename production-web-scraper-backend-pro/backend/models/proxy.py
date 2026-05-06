```python
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from backend.models.base import Base
from sqlalchemy import func

class Proxy(Base):
    __tablename__ = "proxies"

    id = Column(Integer, primary_key=True, index=True)
    address = Column(String, nullable=False)
    port = Column(Integer, nullable=False)
    username = Column(String, nullable=True)
    password = Column(String, nullable=True)
    enabled = Column(Boolean, default=True)
    last_used = Column(DateTime, server_default=func.now(), onupdate=func.now())
    failed_attempts = Column(Integer, default=0)

    def __repr__(self):
        return f"<Proxy(id={self.id}, address='{self.address}:{self.port}', enabled={self.enabled})>"
```