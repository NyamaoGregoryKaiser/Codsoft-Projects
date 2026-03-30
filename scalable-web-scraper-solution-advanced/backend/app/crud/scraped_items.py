from sqlalchemy.orm import Session

from app.crud.base import CRUDBase
from app.models.scraped_item import ScrapedItem
from app.schemas.scraped_item import ScrapedItemCreate, ScrapedItemUpdate

class CRUDScrapedItem(CRUDBase[ScrapedItem, ScrapedItemCreate, ScrapedItemUpdate]):
    def get_multi_by_scraper(
        self, db: Session, *, scraper_id: int, skip: int = 0, limit: int = 100
    ) -> list[ScrapedItem]:
        return (
            db.query(self.model)
            .filter(self.model.scraper_id == scraper_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_multi_by_job(
        self, db: Session, *, job_id: int, skip: int = 0, limit: int = 100
    ) -> list[ScrapedItem]:
        return (
            db.query(self.model)
            .filter(self.model.job_id == job_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

scraped_item = CRUDScrapedItem(ScrapedItem)