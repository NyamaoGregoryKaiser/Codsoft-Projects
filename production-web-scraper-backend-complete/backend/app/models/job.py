from datetime import datetime
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampedBase

class ScrapingJob(TimestampedBase, Base):
    id = Column(Integer, primary_key=True, index=True)
    scraper_id = Column(Integer, ForeignKey("scrapers.id"), nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String, default="PENDING", nullable=False) # PENDING, RUNNING, COMPLETED, FAILED
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    log_output = Column(Text, nullable=True)

    # Relationships
    scraper = relationship("Scraper", back_populates="jobs")
    owner = relationship("User", back_populates="scraping_jobs")
    results = relationship("ScrapedData", back_populates="job", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<ScrapingJob(id={self.id}, scraper_id={self.scraper_id}, status='{self.status}')>"
```
---