```bash
#!/bin/bash
echo "Waiting for PostgreSQL..."

while ! pg_isready -h db -p 5432 > /dev/null 2>&1; do
  sleep 1
done

echo "PostgreSQL started"

echo "Running Alembic migrations..."
alembic upgrade head

echo "Seeding initial data..."
python backend/seed_data.py

echo "Starting Gunicorn..."
exec gunicorn -k uvicorn.workers.UvicornWorker -c "python:backend.gunicorn_conf" backend.app.main:app
```