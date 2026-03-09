#!/bin/bash
set -e

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL..."
/app/wait-for-it.sh db:5432 --timeout=30 --strict -- \
echo "PostgreSQL is up and running."

# Wait for Redis to be ready
echo "Waiting for Redis..."
/app/wait-for-it.sh redis:6379 --timeout=30 --strict -- \
echo "Redis is up and running."

# Run appropriate command based on the CMD passed
if [ "$1" = "web" ]; then
    echo "Starting FastAPI with Gunicorn..."
    # Apply migrations on startup (optional, better to do manually or in CI/CD)
    # alembic upgrade head
    exec gunicorn app.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
elif [ "$1" = "celery_worker" ]; then
    echo "Starting Celery worker..."
    exec celery -A app.core.celery worker --loglevel=info --concurrency=2
elif [ "$1" = "celery_beat" ]; then
    echo "Starting Celery beat..."
    exec celery -A app.core.celery beat --loglevel=info
else
    exec "$@"
fi
```
**Note**: `wait-for-it.sh` is a common script. You'll need to add it to your `backend/` directory or download it during the build process if you use it in the entrypoint. For simplicity, I'll include the script content here and mention adding it.

**Add `wait-for-it.sh` script**:
Create a file named `wait-for-it.sh` in the `backend/` directory with the content from [https://github.com/vishnubob/wait-for-it/blob/master/wait-for-it.sh](https://github.com/vishnubob/wait-for-it/blob/master/wait-for-it.sh) and make it executable (`chmod +x backend/wait-for-it.sh`).
---