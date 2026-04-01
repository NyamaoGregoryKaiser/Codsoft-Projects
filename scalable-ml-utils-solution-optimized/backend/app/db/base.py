```python
from backend.app.db.base_class import Base # Corrected import path
from backend.app.models.user import User
from backend.app.models.dataset import Dataset
from backend.app.models.model import Model
from backend.app.models.experiment import Experiment

# This file ensures that all SQLAlchemy models are imported,
# so that Alembic has a chance to discover them and generate migrations.
```