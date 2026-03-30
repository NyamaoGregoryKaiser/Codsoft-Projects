from sqlalchemy.orm import Session

from app.crud.base import CRUDBase
from app.models.job import ScrapingJob
from app.schemas.job import ScrapingJobCreate, ScrapingJobUpdate

class CRUDScrapingJob(CRUDBase[ScrapingJob, ScrapingJobCreate, ScrapingJobUpdate]):
    def create_with_owner(
        self, db: Session, *, obj_in: ScrapingJobCreate, owner_id: int
    ) -> ScrapingJob:
        obj_in_data = obj_in.model_dump()
        db_obj = self.model(**obj_in_data, owner_id=owner_id)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_multi_by_owner(
        self, db: Session, *, owner_id: int, skip: int = 0, limit: int = 100
    ) -> list[ScrapingJob]:
        return (
            db.query(self.model)
            .filter(self.model.owner_id == owner_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_multi_by_scraper(
        self, db: Session, *, scraper_id: int, skip: int = 0, limit: int = 100
    ) -> list[ScrapingJob]:
        return (
            db.query(self.model)
            .filter(self.model.scraper_id == scraper_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

job = CRUDScrapingJob(ScrapingJob)