```bash
#!/bin/bash
set -e

echo "Running initial database setup..."

# Wait for PostgreSQL to be ready
until pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 1
done

echo "PostgreSQL is up - executing commands"

# Execute Flyway migrations (if not handled by Spring Boot itself, which it usually is)
# Since Spring Boot handles Flyway on startup, this script is mainly for confirmation
# or to run other direct SQL commands if needed before the app starts.
# For this setup, we rely on the Spring Boot app to run migrations.
# This script ensures the DB is ready for the app.

echo "Database initialization complete."
```