from sqlalchemy import Column, Integer, String, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin
from app.models.task import ScrapingTask

class ScrapingResult(TimestampMixin, Base):
    __tablename__ = "scraping_results"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("scraping_tasks.id"), nullable=False)
    data = Column(JSON, nullable=False) # Store scraped data as JSON
    status_code = Column(Integer, nullable=True) # HTTP status code of the request
    error_message = Column(Text, nullable=True) # Any error message during scraping

    task = relationship("ScrapingTask", back_populates="results")

    def __repr__(self):
        return f"<ScrapingResult(id={self.id}, task_id={self.task_id})>"
```