from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, func, Text
from sqlalchemy.orm import relationship

from app.db.base_class import Base

class ScrapingJob(Base):
    id = Column(Integer, primary_key=True, index=True)
    scraper_id = Column(Integer, ForeignKey("scrapers.id"))
    owner_id = Column(Integer, ForeignKey("users.id"))
    status = Column(String, default="pending", index=True) # pending, running, completed, failed
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    result_count = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)

    scraper = relationship("Scraper", back_populates="jobs")
    owner = relationship("User", back_populates="jobs")
    scraped_items = relationship("ScrapedItem", back_populates="job")