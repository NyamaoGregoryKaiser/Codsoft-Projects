from sqlalchemy import Column, ForeignKey, Integer, JSON, DateTime
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampedBase

class ScrapedData(TimestampedBase, Base):
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("scraping_jobs.id"), nullable=False)
    scraper_id = Column(Integer, ForeignKey("scrapers.id"), nullable=False) # Denormalized for easier query
    data = Column(JSON, nullable=False) # Store scraped data as JSON
    scraped_at = Column(DateTime(timezone=True), default=datetime.now, nullable=False)

    # Relationships
    job = relationship("ScrapingJob", back_populates="results")

    def __repr__(self):
        return f"<ScrapedData(id={self.id}, job_id={self.job_id}, scraper_id={self.scraper_id})>"
```
---