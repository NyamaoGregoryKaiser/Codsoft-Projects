#!/bin/sh

# Wait for PostgreSQL to be ready
echo "Waiting for postgres..."

while ! nc -z db 5432; do
  sleep 0.1
done

echo "PostgreSQL started"

# Apply database migrations
echo "Applying database migrations..."
python manage.py migrate --noinput

# Create superuser if it doesn't exist (only in development)
if [ "$DEBUG" = "True" ]; then
  python manage.py createsuperuser --noinput || true
fi

# Start Gunicorn server
echo "Starting Gunicorn server..."
exec gunicorn cms_project.wsgi:application --bind 0.0.0.0:8000
```

---

### 2. Core Application (Frontend - React)

**Tech Stack:** React 18, Chakra UI, React Router DOM, Axios, JWT-Decode.

#### `frontend/src/config/index.js`

```javascript