```bash
#!/bin/bash
set -e

echo "Running database migrations..."

# Wait for PostgreSQL to be ready
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER"; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 1
done

echo "PostgreSQL is up - executing command"

# Apply initial schema and seed data
# This script applies the initial schema, which also includes seed data for simplicity.
# For a full-fledged migration system, you'd use tools like Flyway, Liquibase, or build a custom one.
# Here, we directly execute the V1 schema.

psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f /docker-entrypoint-initdb.d/V1__initial_schema.sql

echo "Database migrations complete."
```