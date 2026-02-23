```python
from .base import Base, db
from .user import User, Role
from .data_source import DataSource
from .visualization import Visualization
from .dashboard import Dashboard

# You can define many-to-many relationships or backrefs here if they
# span multiple models or require explicit definition.
# For simplicity, backrefs are often defined directly in the model classes.

# Example: If Dashboard and Visualization had a complex many-to-many
# dashboard_visualizations = db.Table('dashboard_visualizations',
#     db.Column('dashboard_id', db.Integer, db.ForeignKey('dashboard.id'), primary_key=True),
#     db.Column('visualization_id', db.Integer, db.ForeignKey('visualization.id'), primary_key=True)
# )

```