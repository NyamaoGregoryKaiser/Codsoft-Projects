from sqlalchemy import Column, Integer, String, JSON, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.db.base_class import Base

class Scraper(Base):
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=True)
    start_url = Column(String, nullable=False)
    # JSON field to store scraping instructions (selectors, pagination rules, etc.)
    parsing_rules = Column(JSON, nullable=False) # e.g., {"item_selector": ".quote", "fields": {"text": "span.text", "author": "small.author"}}
    owner_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="scrapers")
    jobs = relationship("ScrapingJob", back_populates="scraper")
    scraped_items = relationship("ScrapedItem", back_populates="scraper")