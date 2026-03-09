from app.crud.base import CRUDBase
from app.models.scraper import Scraper
from app.schemas.scraper import ScraperCreate, ScraperUpdate

class CRUDScraper(CRUDBase[Scraper, ScraperCreate, ScraperUpdate]):
    pass

scraper = CRUDScraper(Scraper)
```
---