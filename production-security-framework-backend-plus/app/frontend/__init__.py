```python
from flask import Blueprint

frontend_blueprint = Blueprint('frontend', __name__, template_folder='templates', static_folder='static')

from . import routes
```