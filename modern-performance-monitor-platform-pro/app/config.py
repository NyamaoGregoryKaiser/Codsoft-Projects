import os
from datetime import timedelta

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'you-will-never-guess-my-secret'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///app.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Flask-Login
    REMEMBER_COOKIE_DURATION = timedelta(days=30)
    PERMANENT_SESSION_LIFETIME = timedelta(minutes=60) # Extend session on activity

    # Caching (Flask-Caching)
    CACHE_TYPE = 'redis'
    CACHE_REDIS_URL = os.environ.get('REDIS_URL') or 'redis://localhost:6379/0'
    CACHE_DEFAULT_TIMEOUT = 300 # 5 minutes

    # Rate Limiting (Flask-Limiter)
    RATELIMIT_STORAGE_URI = os.environ.get('REDIS_URL') or 'redis://localhost:6379/0'
    RATELIMIT_STRATEGY = 'moving-window' # or 'fixed-window'

    # Logging
    LOG_TO_STDOUT = os.environ.get('LOG_TO_STDOUT', 'False').lower() in ('true', '1', 't')
    LOG_FILE = os.environ.get('LOG_FILE') or 'logs/synapse_sense.log'
    LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO').upper()

    # Worker configuration
    WORKER_INTERVAL_SECONDS = int(os.environ.get('WORKER_INTERVAL_SECONDS', 60)) # Default to 60 seconds

    # Flask environment
    FLASK_ENV = os.environ.get('FLASK_ENV', 'development')

    # Pagination
    ITEMS_PER_PAGE = 10

    # API Keys (for future expansion, e.g., external API integrations)
    # STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY')
    # SENDGRID_API_KEY = os.environ.get('SENDGRID_API_KEY')
```