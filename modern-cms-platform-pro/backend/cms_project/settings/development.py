from .base import *

DEBUG = True

ALLOWED_HOSTS = ['localhost', '127.0.0.1']

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('DB_NAME', 'cms_dev_db'),
        'USER': config('DB_USER', 'cms_dev_user'),
        'PASSWORD': config('DB_PASSWORD', 'cms_dev_password'),
        'HOST': config('DB_HOST', 'db'), # 'db' is the service name in docker-compose
        'PORT': config('DB_PORT', '5432'),
    }
}

# Development specific CORS settings
CORS_ALLOW_ALL_ORIGINS = True

# Static files for development (handled by Django development server)
STATICFILES_FINDERS = [
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'django.contrib.staticfiles.finders.AppDirectoriesFinder',
]

# Disable caching for development
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "unique-snowflake",
    }
}
```

#### `backend/cms_project/settings/production.py`

```python