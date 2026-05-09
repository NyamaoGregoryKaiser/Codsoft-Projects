```python
from typing import List, Optional

from sqlalchemy.orm import Session, joinedload

from app.crud.base import CRUDBase
from app.db.models import Review
from app.schemas.review import ReviewCreate, ReviewUpdate
from app.core.logging_config import setup_logging

logger = setup_logging(__name__)

class CRUDReview(CRUDBase[Review, ReviewCreate, ReviewUpdate]):
    def create_with_owner(
        self, db: Session, *, obj_in: ReviewCreate, user_id: int
    ) -> Review:
        obj_in_data = obj_in.model_dump()
        db_obj = self.model(**obj_in_data, user_id=user_id)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        logger.info(f"Review created for product {obj_in.product_id} by user ID {user_id}.")
        return db_obj

    def get_multi_by_product(
        self, db: Session, *, product_id: int, skip: int = 0, limit: int = 100
    ) -> List[Review]:
        return (
            db.query(self.model)
            .options(joinedload(Review.user)) # Eager load user for review
            .filter(Review.product_id == product_id)
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    def get_by_user_and_product(
        self, db: Session, *, user_id: int, product_id: int
    ) -> Optional[Review]:
        return (
            db.query(self.model)
            .filter(Review.user_id == user_id, Review.product_id == product_id)
            .first()
        )


crud_review = CRUDReview(Review)

```

#### Database Layer (SQLAlchemy & Alembic)