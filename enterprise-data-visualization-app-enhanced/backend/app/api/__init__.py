```python
from flask import Blueprint

api_bp = Blueprint('api', __name__)

from . import auth, data_sources, visualizations, dashboards

```