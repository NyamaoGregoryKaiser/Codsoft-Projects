```python
from flask import Blueprint

comments_blueprint = Blueprint('comments', __name__)

from . import routes
```