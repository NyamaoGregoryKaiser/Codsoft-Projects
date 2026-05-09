```python
from typing import List, Optional

from sqlalchemy.orm import Session, joinedload

from app.crud.base import CRUDBase
from app.db.models import Order, OrderItem, Product
from app.schemas.order import OrderCreate, OrderUpdate # OrderUpdate for status
from app.core.logging_config import setup_logging

logger = setup_logging(__name__)

class CRUDOrder(CRUDBase[Order, OrderCreate, OrderUpdate]):
    def create(self, db: Session, *, obj_in: OrderCreate) -> Order:
        db_order = Order(
            user_id=obj_in.user_id,
            total_amount=sum(item.quantity * item.price_at_order for item in obj_in.order_items),
            status="pending" # Initial status
        )
        db.add(db_order)
        db.flush() # Flush to get db_order.id before committing

        for item_data in obj_in.order_items:
            db_order_item = OrderItem(
                order_id=db_order.id,
                product_id=item_data.product_id,
                quantity=item_data.quantity,
                price_at_order=item_data.price_at_order
            )
            db.add(db_order_item)
        
        db.commit()
        db.refresh(db_order)
        logger.info(f"Order {db_order.id} created for user ID {obj_in.user_id}.")
        return db_order

    def get_multi_by_user(
        self, db: Session, *, user_id: int, skip: int = 0, limit: int = 100
    ) -> List[Order]:
        return (
            db.query(self.model)
            .options(joinedload(Order.items).joinedload(OrderItem.product))
            .filter(Order.user_id == user_id)
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    def get(self, db: Session, id: int) -> Optional[Order]:
        return (
            db.query(self.model)
            .options(joinedload(Order.items).joinedload(OrderItem.product))
            .filter(self.model.id == id)
            .first()
        )


crud_order = CRUDOrder(Order)

```