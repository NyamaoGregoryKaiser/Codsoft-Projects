from .base import *

# Override base settings for production
DEBUG = False

# Ensure these are set in .env for production
# ALLOWED_HOSTS = env.list('ALLOWED_HOSTS')
# CSRF_TRUSTED_ORIGINS = env.list('CSRF_TRUSTED_ORIGINS')
# CORS_ALLOWED_ORIGINS = env.list('CORS_ALLOWED_ORIGINS')

# Security settings
SECURE_SSL_REDIRECT = env.bool('SECURE_SSL_REDIRECT', default=True)
SESSION_COOKIE_SECURE = env.bool('SESSION_COOKIE_SECURE', default=True)
CSRF_COOKIE_SECURE = env.bool('CSRF_COOKIE_SECURE', default=True)
SECURE_BROWSER_XSS_FILTER = env.bool('SECURE_BROWSER_XSS_FILTER', default=True)
SECURE_CONTENT_TYPE_NOSNIFF = env.bool('SECURE_CONTENT_TYPE_NOSNIFF', default=True)
X_FRAME_OPTIONS = 'DENY' # Prevents clickjacking

# HSTS settings
SECURE_HSTS_SECONDS = env.int('SECURE_HSTS_SECONDS', default=31536000) # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = env.bool('SECURE_HSTS_INCLUDE_SUBDOMAINS', default=True)
SECURE_HSTS_PRELOAD = env.bool('SECURE_HSTS_PRELOAD', default=True)

# Whitenoise for static files in production
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Database pooling (e.g., pgBouncer or connection pool in app server)
# For larger applications, consider a connection pooling solution
# DATABASES['default']['CONN_MAX_AGE'] = 600

# Cache setup (already in base, ensures Redis is used)
# CACHES = {
#     'default': {
#         'BACKEND': 'django_redis.cache.RedisCache',
#         'LOCATION': env('REDIS_URL'),
#         'OPTIONS': {
#             'CLIENT_CLASS': 'django_redis.client.DefaultClient',
#             'COMPRESSOR': 'django_redis.compressors.zlib.ZlibCompressor', # Example compressor
#         }
#     }
# }

# Production logging settings (already in base, will use file handlers)
LOGGING['handlers']['console']['level'] = 'INFO'
LOGGING['loggers']['django']['level'] = 'INFO'
LOGGING['loggers']['core']['level'] = 'INFO'

# Admin URL security (rename the admin URL in config/urls.py for production)
# ADMIN_URL = env('ADMIN_URL', default='admin/') # Example