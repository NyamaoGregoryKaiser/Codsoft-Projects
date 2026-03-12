import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from backend.app import create_app
from backend.app.config import get_config_class

# Determine config based on FLASK_CONFIG environment variable
flask_config_name = os.environ.get('FLASK_CONFIG', 'development')
config_class = get_config_class(flask_config_name)

app = create_app(config_class)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
```