```python
# Import all the models here, so that Base has them before being
# imported by Alembic
from sqlalchemy.orm import declarative_base

Base = declarative_base()

from app.db.models import User, DataSource, Dataset, Visualization, Dashboard, DashboardItem
```