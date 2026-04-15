```python
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_caching import Cache
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_cors import CORS
from flask_restx import Api

# Initialize extensions, but defer app registration
db = SQLAlchemy()
jwt = JWTManager()
cache = Cache()
limiter = Limiter(key_func=get_remote_address, default_limits=["200 per day", "50 per hour"])
cors = CORS()

# Flask-RESTX API initialization
api = Api(
    version='1.0',
    title='Blog API',
    description='A comprehensive API for a blog platform with user management, posts, and comments.',
    doc='/docs' # This sets the path for the Swagger UI
)

# Example of JWT token blocklist (for revoked tokens)
# In a real application, this would be a persistent store like Redis
REVOKED_TOKENS = set()

@jwt.token_in_blocklist_loader
def check_if_token_in_blocklist(jwt_header, jwt_payload):
    jti = jwt_payload['jti']
    return jti in REVOKED_TOKENS
```