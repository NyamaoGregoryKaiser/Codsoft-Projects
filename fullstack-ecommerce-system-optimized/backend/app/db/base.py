```python
# Import all the models here, so that Base has them before being
# imported by Alembic
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

# Import all models to ensure they are registered with the Base
from app.db.models import User, Product, Category, Cart, CartItem, Order, OrderItem, Review

```