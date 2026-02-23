```python
import os
from datetime import timedelta

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'a_very_secret_key_that_should_be_changed_in_prod')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'postgresql://user:password@db:5432/dashboard_db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'jwt-super-secret-key')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    CORS_HEADERS = 'Content-Type,Authorization'

    # Cache config
    CACHE_TYPE = os.environ.get('CACHE_TYPE', 'RedisCache')
    CACHE_REDIS_HOST = os.environ.get('CACHE_REDIS_HOST', 'redis')
    CACHE_REDIS_PORT = os.environ.get('CACHE_REDIS_PORT', '6379')
    CACHE_REDIS_DB = os.environ.get('CACHE_REDIS_DB', '0')
    CACHE_REDIS_URL = f"redis://{CACHE_REDIS_HOST}:{CACHE_REDIS_PORT}/{CACHE_REDIS_DB}"
    CACHE_DEFAULT_TIMEOUT = 300 # 5 minutes

    # Rate Limiting config
    RATELIMIT_STORAGE_URL = os.environ.get('RATELIMIT_STORAGE_URL', CACHE_REDIS_URL) # Use Redis for rate limiting storage

class DevelopmentConfig(Config):
    DEBUG = True
    # SQLALCHEMY_DATABASE_URI = 'sqlite:///dev.db' # For quick local dev without Docker
    pass

class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = os.environ.get('TEST_DATABASE_URL', 'postgresql://test_user:test_password@db_test:5432/test_dashboard_db')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=5) # Shorter expiration for tests
    CACHE_TYPE = 'SimpleCache' # Use in-memory cache for tests
    CACHE_DEFAULT_TIMEOUT = 1
    RATELIMIT_STORAGE_URL = 'memory://' # Use in-memory for tests

class ProductionConfig(Config):
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') # Must be set in prod env
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') # Must be set in prod env
    SECRET_KEY = os.environ.get('SECRET_KEY') # Must be set in prod env
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', 'https://your-frontend-domain.com').split(',')

```