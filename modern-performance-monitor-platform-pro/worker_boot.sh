#!/bin/sh
set -e

echo "Waiting for PostgreSQL to be ready for worker..."
until nc -z db 5432; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 1
done
echo "PostgreSQL is ready for worker!"

echo "Waiting for Redis to be ready for worker..."
until nc -z redis 6379; do
  echo "Redis is unavailable - sleeping"
  sleep 1
done
echo "Redis is ready for worker!"

echo "Starting performance monitoring worker..."
exec python -m app.worker
```