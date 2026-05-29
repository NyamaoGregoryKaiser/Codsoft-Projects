#!/bin/bash
set -e

# Wait for PostgreSQL to be ready
echo "Waiting for postgres..."
while ! pg_isready -h db -p 5432 -U ${POSTGRES_USER:-user}; do
  echo "Postgres is unavailable - sleeping"
  sleep 1
done
echo "Postgres is up - continuing"

# Apply database migrations
echo "Applying database migrations..."
python manage.py migrate --noinput

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Seed data (optional, only if you want to run this every time the container starts)
# echo "Seeding initial data..."
# python manage.py seed_data

exec "$@"
--- END FILE ---

---