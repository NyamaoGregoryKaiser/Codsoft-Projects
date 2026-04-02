from .base import *

# Override base settings for development
DEBUG = True

ALLOWED_HOSTS += ['localhost', '127.0.0.1']

CORS_ALLOWED_ORIGINS += [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

CSRF_TRUSTED_ORIGINS += [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# For local development, sqlite might be fine, or switch to postgresql
# DATABASES = {
#     'default': {
#         'ENGINE': 'django.db.backends.sqlite3',
#         'NAME': BASE_DIR / 'db.sqlite3',
#     }
# }

# Static files served by Django dev server
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Caching for development can be local memory
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'unique-snowflake',
    }
}

# Log to console for development
LOGGING['handlers']['console']['level'] = 'DEBUG'
LOGGING['loggers']['django']['level'] = 'DEBUG'
LOGGING['loggers']['core']['level'] = 'DEBUG'

# Email backend for development
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'