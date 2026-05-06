```python
from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from backend.models.base import Base

class ScraperConfig(Base):
    __tablename__ = "scraper_configs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    start_url = Column(String, nullable=False)
    # Stored as JSON string to allow flexible selector definitions
    selectors_json = Column(Text, nullable=False)
    schedule_cron = Column(String, nullable=True) # e.g., "0 0 * * *" for daily
    headless = Column(Boolean, default=True)
    use_proxy = Column(Boolean, default=False)
    use_user_agent = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    description = Column(Text, nullable=True)

    owner_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="scrapers")
    tasks = relationship("ScrapingTask", back_populates="config")

    def __repr__(self):
        return f"<ScraperConfig(id={self.id}, name='{self.name}', url='{self.start_url}')>"
```