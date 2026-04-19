import os
from app import create_app

# The FLASK_CONFIG environment variable is used to select the configuration.
# For Gunicorn, you typically set this in the environment where Gunicorn runs.
app = create_app(os.getenv('FLASK_CONFIG') or 'production')

if __name__ == '__main__':
    # This block is for local development without Gunicorn
    # For production, Gunicorn will handle running the app.
    app.run(host='0.0.0.0', port=5000)
```