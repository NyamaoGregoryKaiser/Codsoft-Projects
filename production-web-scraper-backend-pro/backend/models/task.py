```python
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from backend.models.base import Base
from sqlalchemy import Enum as SQLEnum
import enum

class TaskStatus(enum.Enum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"

class ScrapingTask(Base):
    __tablename__ = "scraping_tasks"

    id = Column(Integer, primary_key=True, index=True)
    scraper_config_id = Column(Integer, ForeignKey("scraper_configs.id"), nullable=False)
    status = Column(SQLEnum(TaskStatus), default=TaskStatus.PENDING, nullable=False)
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    log = Column(Text, nullable=True)
    result_count = Column(Integer, default=0)

    owner_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="tasks")
    config = relationship("ScraperConfig", back_populates="tasks")
    results = relationship("ScrapingResult", back_populates="task", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<ScrapingTask(id={self.id}, scraper_id={self.scraper_config_id}, status='{self.status}')>"

class ScrapingResult(Base):
    __tablename__ = "scraping_results"

    id = Column(Integer, primary_key=True, index=True)
    scraping_task_id = Column(Integer, ForeignKey("scraping_tasks.id"), nullable=False)
    data = Column(JSON, nullable=False) # Stores the extracted data as JSON

    task = relationship("ScrapingTask", back_populates="results")

    def __repr__(self):
        return f"<ScrapingResult(id={self.id}, task_id={self.scraping_task_id})>"
```