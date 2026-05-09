```python
from typing import Optional

from sqlalchemy.orm import Session

from app.crud.base import CRUDBase
from app.db.models import Category
from app.schemas.category import CategoryCreate, CategoryUpdate
from app.core.logging_config import setup_logging

logger = setup_logging(__name__)

class CRUDCategory(CRUDBase[Category, CategoryCreate, CategoryUpdate]):
    def get_by_name(self, db: Session, *, name: str) -> Optional[Category]:
        return db.query(Category).filter(Category.name == name).first()

crud_category = CRUDCategory(Category)

```