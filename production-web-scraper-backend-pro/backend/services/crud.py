```python
from typing import TypeVar, Type, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from pydantic import BaseModel
from backend.models.base import Base
from backend.core.logger import logger

ModelType = TypeVar("ModelType", bound=Base)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)

class CRUDBase:
    def __init__(self, model: Type[ModelType]):
        self.model = model

    def get(self, db: Session, id: Any) -> Optional[ModelType]:
        return db.query(self.model).filter(self.model.id == id).first()

    def get_multi(self, db: Session, skip: int = 0, limit: int = 100) -> List[ModelType]:
        return db.query(self.model).offset(skip).limit(limit).all()

    def get_multi_with_count(self, db: Session, skip: int = 0, limit: int = 100, **filters) -> tuple[List[ModelType], int]:
        query = db.query(self.model)
        for key, value in filters.items():
            if hasattr(self.model, key):
                query = query.filter(getattr(self.model, key) == value)
        
        total = query.count()
        items = query.offset(skip).limit(limit).all()
        return items, total

    def create(self, db: Session, obj_in: CreateSchemaType, **kwargs) -> ModelType:
        obj_in_data = obj_in.model_dump()
        db_obj = self.model(**obj_in_data, **kwargs)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        logger.info(f"Created new {self.model.__tablename__} with id {db_obj.id}")
        return db_obj

    def update(self, db: Session, db_obj: ModelType, obj_in: UpdateSchemaType) -> ModelType:
        obj_data = db_obj.__dict__
        update_data = obj_in.model_dump(exclude_unset=True)
        for field in obj_data:
            if field in update_data:
                setattr(db_obj, field, update_data[field])
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        logger.info(f"Updated {self.model.__tablename__} with id {db_obj.id}")
        return db_obj

    def remove(self, db: Session, id: Any) -> Optional[ModelType]:
        obj = db.query(self.model).get(id)
        if obj:
            db.delete(obj)
            db.commit()
            logger.info(f"Removed {self.model.__tablename__} with id {id}")
            return obj
        return None

# Specific CRUD instances for each model
from backend.models.user import User
from backend.schemas.user import UserCreate, UserUpdate
user = CRUDBase[User, UserCreate, UserUpdate](User)

from backend.models.scraper import ScraperConfig
from backend.schemas.scraper import ScraperConfigCreate, ScraperConfigUpdate
scraper_config = CRUDBase[ScraperConfig, ScraperConfigCreate, ScraperConfigUpdate](ScraperConfig)

from backend.models.task import ScrapingTask, ScrapingResult
from backend.schemas.task import ScrapingTaskCreate, ScrapingResultBase
scraping_task = CRUDBase[ScrapingTask, ScrapingTaskCreate, BaseModel](ScrapingTask)
scraping_result = CRUDBase[ScrapingResult, ScrapingResultBase, BaseModel](ScrapingResult) # No direct update schema for result

from backend.models.proxy import Proxy
from backend.schemas.proxy import ProxyCreate, ProxyUpdate
proxy = CRUDBase[Proxy, ProxyCreate, ProxyUpdate](Proxy)

from backend.models.user_agent import UserAgent
from backend.schemas.user_agent import UserAgentCreate, UserAgentUpdate
user_agent = CRUDBase[UserAgent, UserAgentCreate, UserAgentUpdate](UserAgent)
```