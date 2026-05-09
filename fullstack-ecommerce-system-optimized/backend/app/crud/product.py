```python
from typing import List, Optional, Any, Dict, Union

from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.crud.base import CRUDBase
from app.db.models import Product, User
from app.schemas.product import ProductCreate, ProductUpdate
from app.core.logging_config import setup_logging

logger = setup_logging(__name__)

class CRUDProduct(CRUDBase[Product, ProductCreate, ProductUpdate]):
    def create_with_owner(
        self, db: Session, *, obj_in: ProductCreate, owner_id: int
    ) -> Product:
        obj_in_data = obj_in.model_dump()
        db_obj = self.model(**obj_in_data, owner_id=owner_id)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        logger.info(f"Product '{db_obj.name}' created by user ID {owner_id}.")
        return db_obj

    def get_multi_by_owner(
        self, db: Session, *, owner_id: int, skip: int = 0, limit: int = 100
    ) -> List[Product]:
        return (
            db.query(self.model)
            .filter(Product.owner_id == owner_id)
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    def get_multi_filtered(
        self,
        db: Session,
        *,
        skip: int = 0,
        limit: int = 100,
        search: Optional[str] = None,
        category_id: Optional[int] = None,
    ) -> List[Product]:
        query = db.query(self.model)

        if search:
            query = query.filter(
                or_(
                    self.model.name.ilike(f"%{search}%"),
                    self.model.description.ilike(f"%{search}%")
                )
            )
        if category_id:
            query = query.filter(self.model.category_id == category_id)

        return query.offset(skip).limit(limit).all()

    def is_owner(self, user: User, product: Product) -> bool:
        return product.owner_id == user.id


crud_product = CRUDProduct(Product)

```