```python
from flask import Blueprint
from app.extensions import api

api_blueprint = Blueprint('api', __name__, url_prefix='/api')
api.init_app(api_blueprint)

# Define common API namespace if needed, otherwise each module can define its own
from flask_restx import Namespace
api_namespace = Namespace('common', description='Common API operations')
```