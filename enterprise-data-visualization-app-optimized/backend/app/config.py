```python
import os
from datetime import timedelta

class Config:
    """Base configuration."""
    SECRET_KEY = os.environ.get('SECRET_KEY', 'default-dev-secret-key-please-change-me')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'another-dev-jwt-secret-key')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'postgresql://user:password@localhost:5432/vizcraft_db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    DEBUG = False
    TESTING = False
    FLASK_ENV = os.environ.get('FLASK_ENV', 'development')

    # JWT Configuration
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    JWT_TOKEN_LOCATION = ["headers"] # Allow tokens in headers, query string, or cookies

    # Cache Configuration
    CACHE_TYPE = os.environ.get('CACHE_TYPE', 'simple') # 'simple', 'redis', 'filesystem'
    CACHE_REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
    CACHE_DEFAULT_TIMEOUT = 300 # seconds

    # Rate Limiting Configuration
    RATELIMIT_STORAGE_URL = os.environ.get('RATELIMIT_STORAGE_URL', 'redis://localhost:6379/1')

    # CORS Configuration
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', 'http://localhost:3000').split(',')
    CORS_SUPPORTS_CREDENTIALS = True

    # Logging Configuration
    LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO')
    LOG_FILE_PATH = os.environ.get('LOG_FILE_PATH', '/var/log/vizcraft/app.log')
    LOG_MAX_BYTES = 10 * 1024 * 1024 # 10 MB
    LOG_BACKUP_COUNT = 5

class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True
    FLASK_ENV = 'development'
    SQLALCHEMY_ECHO = True # Log SQL queries

class TestingConfig(Config):
    """Testing configuration."""
    TESTING = True
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.environ.get('TEST_DATABASE_URL', 'postgresql://user:password@localhost:5432/vizcraft_test_db')
    CACHE_TYPE = 'simple' # Don't use Redis for unit tests
    RATELIMIT_STORAGE_URL = 'memory://'
    SECRET_KEY = 'test_secret_key'
    JWT_SECRET_KEY = 'test_jwt_secret_key'

class ProductionConfig(Config):
    """Production configuration."""
    DEBUG = False
    FLASK_ENV = 'production'
    # In production, ensure these are robustly set via environment variables
    # e.g., DATABASE_URL, SECRET_KEY, JWT_SECRET_KEY, REDIS_URL
    # Logging might be set up to use a log aggregation service
```