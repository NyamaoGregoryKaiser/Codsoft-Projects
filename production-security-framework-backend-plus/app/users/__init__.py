```python
from flask import Blueprint

users_blueprint = Blueprint('users', __name__)

from . import routes
```