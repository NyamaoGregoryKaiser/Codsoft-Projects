#!/bin/sh
set -e

echo "Waiting for PostgreSQL to be ready..."
until nc -z db 5432; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 1
done
echo "PostgreSQL is ready!"

echo "Running database migrations..."
flask db upgrade

echo "Seeding initial data if necessary..."
flask db seed

echo "Starting Gunicorn server..."
exec gunicorn -w 4 -b 0.0.0.0:5000 "app:create_app()"
```