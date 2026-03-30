from sqlalchemy import Column, Integer, String, JSON, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.db.base_class import Base

class ScrapedItem(Base):
    id = Column(Integer, primary_key=True, index=True)
    scraper_id = Column(Integer, ForeignKey("scrapers.id"))
    job_id = Column(Integer, ForeignKey("scrapingjobs.id"), nullable=True) # Optional: if item belongs to a specific job run
    data = Column(JSON, nullable=False) # The actual scraped data
    source_url = Column(String, nullable=True) # URL from which this item was scraped

    scraper = relationship("Scraper", back_populates="scraped_items")
    job = relationship("ScrapingJob", back_populates="scraped_items")