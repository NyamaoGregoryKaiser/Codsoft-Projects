```python
import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv() # Load environment variables from .env

class Config:
    """Base configuration."""
    SECRET_KEY = os.getenv('SECRET_KEY', 'a_very_secret_key_for_dev')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt_super_secret_key_for_dev')

    # Database
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'postgresql://user:password@localhost:5432/blog_db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = False # Set to True to log all SQL queries

    # JWT
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(seconds=int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES_SECONDS', 3600))) # 1 hour
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=int(os.getenv('JWT_REFRESH_TOKEN_EXPIRES_DAYS', 30))) # 30 days
    JWT_BLACKLIST_ENABLED = True
    JWT_BLACKLIST_TOKEN_CHECKS = ['access', 'refresh']

    # Caching
    CACHE_TYPE = 'RedisCache' # Flask-Caching with Redis
    CACHE_REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
    CACHE_DEFAULT_TIMEOUT = 300 # 5 minutes

    # Rate Limiting
    RATELIMIT_STORAGE_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
    RATELIMIT_HEADERS_ENABLED = True # Include X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset headers

    # CORS
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:3000').split(',')
    CORS_SUPPORTS_CREDENTIALS = True

    # Logging
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO').upper()
    LOG_FILE_PATH = os.getenv('LOG_FILE_PATH', 'logs/app.log')
    LOG_MAX_BYTES = 10 * 1024 * 1024 # 10 MB
    LOG_BACKUP_COUNT = 5

    # API Documentation (Flask-RESTX)
    RESTX_SWAGGER_UI_DOC_EXPANSION = 'list'
    RESTX_VALIDATE = True
    RESTX_MASK_SWAGGER = False
    RESTX_ERROR_404_HELP = False

class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True
    SQLALCHEMY_ECHO = True # Log SQL queries in development
    LOG_LEVEL = 'DEBUG'

class TestingConfig(Config):
    """Testing configuration."""
    TESTING = True
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL_TEST', 'postgresql://test_user:test_password@localhost:5432/test_db')
    SQLALCHEMY_ECHO = False
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(seconds=10) # Short expiry for tests
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(seconds=30)
    CACHE_TYPE = 'SimpleCache' # Use SimpleCache for testing (no external Redis needed)
    RATELIMIT_STORAGE_URL = 'memory://' # Use in-memory storage for testing rate limits
    CORS_ORIGINS = ['*'] # Allow all for tests
    LOG_LEVEL = 'WARNING' # Reduce log verbosity during tests

class ProductionConfig(Config):
    """Production configuration."""
    DEBUG = False
    SQLALCHEMY_ECHO = False
    # Ensure all secrets are pulled from environment variables in production
    # JWT_SECRET_KEY, SECRET_KEY, DATABASE_URL, REDIS_URL should be set in production environment
    LOG_LEVEL = 'INFO'


config_by_name = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
}
```