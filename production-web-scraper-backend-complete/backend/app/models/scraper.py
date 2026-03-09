from sqlalchemy import Column, ForeignKey, Integer, String, Text, JSON
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampedBase

class Scraper(TimestampedBase, Base):
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=True)
    target_url = Column(String, nullable=False)
    parse_rules = Column(JSON, nullable=False) # JSONB for flexible rules (e.g., CSS selectors, XPath)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Relationships
    owner = relationship("User", back_populates="scrapers")
    jobs = relationship("ScrapingJob", back_populates="scraper")

    def __repr__(self):
        return f"<Scraper(id={self.id}, name='{self.name}', target_url='{self.target_url}')>"
```
---