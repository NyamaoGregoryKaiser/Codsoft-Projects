```python
from flask import Blueprint

auth_blueprint = Blueprint('auth', __name__)

# Import routes to register them with the blueprint
from . import routes
```