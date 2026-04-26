```bash
#!/bin/bash
# This script is used to start the FastAPI application in a Docker container.
# It ensures the database is ready and migrations are applied before starting the server.

set -e # Exit immediately if a command exits with a non-zero status

echo "Waiting for PostgreSQL database to become available..."
# Use netcat (nc) to wait until the database host and port are reachable
# -z: zero-I/O mode (scan for listening daemons)
# -v: verbose output
# -w 1: timeout for connection in seconds
# Sleep 1 second between retries
while ! nc -z ${POSTGRES_HOST:-db} ${POSTGRES_PORT:-5432}; do
  sleep 1
done
echo "PostgreSQL database is available."

echo "Running Alembic database migrations..."
# Run the migration script
python /app/scripts/run_migrations.py

echo "Applying initial seed data..."
python /app/scripts/seed_data.py

echo "Starting FastAPI application with Gunicorn..."
# Execute the command defined in the Dockerfile's CMD
exec "$@"
```