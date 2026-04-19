import os
from datetime import timedelta

basedir = os.path.abspath(os.path.dirname(__file__))

class Config:
    """Base configuration."""
    SECRET_KEY = os.environ.get('SECRET_KEY', 'a_very_secret_and_long_key_for_development')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'super-secret-jwt-key')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    BCRYPT_LOG_ROUNDS = 13 # Increased for security
    CACHE_TYPE = os.environ.get('CACHE_TYPE', 'RedisCache')
    CACHE_REDIS_HOST = os.environ.get('REDIS_HOST', 'redis')
    CACHE_REDIS_PORT = os.environ.get('REDIS_PORT', '6379')
    CACHE_REDIS_DB = os.environ.get('REDIS_DB', '0')
    CACHE_DEFAULT_TIMEOUT = 300 # 5 minutes default cache timeout
    RATELIMIT_STORAGE_URL = os.environ.get('REDIS_URL', f'redis://{CACHE_REDIS_HOST}:{CACHE_REDIS_PORT}/{CACHE_REDIS_DB}')
    RATELIMIT_STRATEGY = 'fixed-window' # or 'token-bucket'
    LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO').upper()

    @staticmethod
    def init_app(app):
        pass

class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.environ.get('DEV_DATABASE_URL') or \
        'postgresql://projectflow_user:projectflow_password@db:5432/projectflow_dev_db'
    FLASK_ENV = 'development'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=15) # Shorter for dev
    CACHE_DEFAULT_TIMEOUT = 60 # Shorter for dev
    LOG_LEVEL = 'DEBUG'

class TestingConfig(Config):
    """Testing configuration."""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = os.environ.get('TEST_DATABASE_URL') or \
        'postgresql://projectflow_test_user:projectflow_test_password@db:5432/projectflow_test_db'
    BCRYPT_LOG_ROUNDS = 4  # For faster tests
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=5) # Shorter for tests
    CACHE_TYPE = 'NullCache' # Disable caching for consistent tests
    RATELIMIT_ENABLED = False # Disable rate limiting for tests
    LOG_LEVEL = 'CRITICAL' # Suppress logs during tests

class ProductionConfig(Config):
    """Production configuration."""
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=6) # Longer for prod
    LOG_LEVEL = 'INFO'
    # Add more production specific settings like stricter logging, error reporting etc.

config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
```