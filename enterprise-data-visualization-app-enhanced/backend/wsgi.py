```python
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

from backend.app import create_app

# Get the desired configuration class name from environment variables
config_name = os.environ.get('FLASK_ENV', 'development')

# Dynamically import the correct config class
if config_name == 'development':
    from backend.app.config import DevelopmentConfig as ConfigClass
elif config_name == 'testing':
    from backend.app.config import TestingConfig as ConfigClass
elif config_name == 'production':
    from backend.app.config import ProductionConfig as ConfigClass
else:
    from backend.app.config import Config as ConfigClass # Default base config

app = create_app(config_class=ConfigClass)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)

```