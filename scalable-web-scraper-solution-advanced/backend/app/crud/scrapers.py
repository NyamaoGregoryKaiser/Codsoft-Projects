from sqlalchemy.orm import Session

from app.crud.base import CRUDBase
from app.models.scraper import Scraper
from app.schemas.scraper import ScraperCreate, ScraperUpdate


class CRUDScraper(CRUDBase[Scraper, ScraperCreate, ScraperUpdate]):
    def create_with_owner(
        self, db: Session, *, obj_in: ScraperCreate, owner_id: int
    ) -> Scraper:
        obj_in_data = obj_in.model_dump()
        db_obj = self.model(**obj_in_data, owner_id=owner_id)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_multi_by_owner(
        self, db: Session, *, owner_id: int, skip: int = 0, limit: int = 100
    ) -> list[Scraper]:
        return (
            db.query(self.model)
            .filter(self.model.owner_id == owner_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

scraper = CRUDScraper(Scraper)