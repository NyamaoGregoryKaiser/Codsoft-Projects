#!/bin/bash
set -e

echo "Waiting for PostgreSQL to be ready..."
# Use a simple loop to wait for the database
# The docker-compose healthcheck usually covers this, but good to have in run.sh too.
/usr/bin/wait-for-it.sh db:5432 --timeout=30 --strict -- echo "PostgreSQL is up!"

echo "Running Alembic migrations..."
# Check if alembic directory exists
if [ -d "alembic" ]; then
    poetry run alembic upgrade head
    echo "Alembic migrations applied."
else
    echo "Alembic directory not found. Skipping migrations."
fi

echo "Seeding database with initial data..."
# Check if seed_db.py exists
if [ -f "seed_db.py" ]; then
    poetry run python seed_db.py
    echo "Database seeding complete."
else
    echo "seed_db.py not found. Skipping seeding."
fi

echo "Starting FastAPI application..."
exec poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload