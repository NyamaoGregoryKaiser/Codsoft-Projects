```bash
#!/bin/bash
set -e

echo "Running database initialization script..."

# Wait for PostgreSQL to be ready
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$POSTGRES_USER"; do
  echo "Waiting for postgres..."
  sleep 2
done

echo "PostgreSQL is up - executing commands"

# Check if the database exists, if not, create it
# This part is typically handled by POSTGRES_DB env var in docker-compose,
# but can be explicit if needed for more complex scenarios.
# For now, relying on standard PostgreSQL Docker behavior.

# Apply migration scripts in order
for f in /docker-entrypoint-initdb.d/migrations/V*.sql; do
    echo "Applying migration: $f"
    psql -v ON_ERROR_STOP=1 -h "$DB_HOST" -p "$DB_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f "$f"
done

echo "Database initialization complete!"
```