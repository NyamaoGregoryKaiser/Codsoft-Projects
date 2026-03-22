# Import all the models here to make them available to Base.metadata
# which is used by Alembic
from app.db.base_class import Base # noqa
from app.models.user import User # noqa
from app.models.item import Item # noqa
```