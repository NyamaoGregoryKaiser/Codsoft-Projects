import os

basedir = os.path.abspath(os.path.dirname(__file__))

class Config:
    FLASK_APP_NAME = os.environ.get('FLASK_APP_NAME', 'SecureAuth')
    SECRET_KEY = os.environ.get('SECRET_KEY', 'default-dev-secret-key-please-change')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'default-jwt-secret-key-please-change')
    JWT_ACCESS_TOKEN_EXPIRES = 3600  # 1 hour
    JWT_REFRESH_TOKEN_EXPIRES = 2592000 # 30 days
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'sqlite:///' + os.path.join(basedir, 'app.db')

    # Mail Configuration (for password reset)
    MAIL_SERVER = os.environ.get('MAIL_SERVER')
    MAIL_PORT = int(os.environ.get('MAIL_PORT', 25))
    MAIL_USE_TLS = os.environ.get('MAIL_USE_TLS', 'true').lower() in \
                   ['true', 'on', '1']
    MAIL_USE_SSL = os.environ.get('MAIL_USE_SSL', 'false').lower() in \
                   ['true', 'on', '1']
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD')
    MAIL_DEFAULT_SENDER = 'no-reply@secureauth.com'

    # Rate Limiting
    RATELIMIT_STORAGE_URI = os.environ.get('REDIS_URL', 'memory://')
    RATELIMIT_DEFAULT = "200 per day;50 per hour"

    # Caching
    CACHE_TYPE = os.environ.get('CACHE_TYPE', 'redis') # 'simple' for local, 'redis' for production
    CACHE_REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
    CACHE_DEFAULT_TIMEOUT = 300 # 5 minutes

class DevelopmentConfig(Config):
    FLASK_ENV = 'development'
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.environ.get('DEV_DATABASE_URL') or \
        'postgresql://user:password@db:5432/secureauth_db' # Use Docker service name 'db'
    SQLALCHEMY_ECHO = True # Log SQL queries
    JWT_ACCESS_TOKEN_EXPIRES = 3600 # 1 hour for dev
    JWT_REFRESH_TOKEN_EXPIRES = 2592000 # 30 days for dev
    CACHE_TYPE = 'simple' # Use simple cache for local dev without Redis dependency
    RATELIMIT_STORAGE_URI = 'memory://' # Use memory for local dev without Redis dependency


class TestingConfig(Config):
    FLASK_ENV = 'testing'
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:' # Use in-memory SQLite for tests
    JWT_ACCESS_TOKEN_EXPIRES = 3600 # 1 hour for tests
    JWT_REFRESH_TOKEN_EXPIRES = 2592000 # 30 days for tests
    MAIL_SUPPRESS_SEND = True # Do not send emails during tests
    CACHE_TYPE = 'null' # No caching during tests
    RATELIMIT_STORAGE_URI = 'memory://' # Use memory for tests

class ProductionConfig(Config):
    FLASK_ENV = 'production'
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
    JWT_ACCESS_TOKEN_EXPIRES = 900 # 15 minutes for production
    JWT_REFRESH_TOKEN_EXPIRES = 604800 # 7 days for production (more frequent refresh)
    CACHE_TYPE = 'redis'
    RATELIMIT_STORAGE_URI = os.environ.get('REDIS_URL')


def get_config_class(env_name):
    if env_name == 'production':
        return ProductionConfig
    elif env_name == 'testing':
        return TestingConfig
    else:
        return DevelopmentConfig
```