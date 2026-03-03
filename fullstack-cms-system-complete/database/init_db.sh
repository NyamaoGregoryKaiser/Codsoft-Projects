```bash
#!/bin/bash
set -e

echo "Running database migrations..."

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to start..."
until pg_isready -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER"; do
  >&2 echo "Postgres is unavailable - sleeping"
  sleep 1
done
echo "PostgreSQL is up and running!"

# Create database if it doesn't exist
PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -tc "SELECT 1 FROM pg_database WHERE datname = '$POSTGRES_DB'" | grep -q 1 || PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -c "CREATE DATABASE $POSTGRES_DB"
echo "Database '$POSTGRES_DB' ensured to exist."

# Connect to the specific database for migrations and seeding
export PGPASSWORD="$POSTGRES_PASSWORD"
DB_CONNECTION_STRING="host=$POSTGRES_HOST port=$POSTGRES_PORT user=$POSTGRES_USER dbname=$POSTGRES_DB"

# Run migrations
for file in /app/database/migrations/*.sql; do
    echo "Applying migration: $(basename "$file")"
    psql "$DB_CONNECTION_STRING" -f "$file"
done

# Run seed data
echo "Applying seed data..."
for file in /app/database/seed/*.sql; do
    echo "Applying seed: $(basename "$file")"
    psql "$DB_CONNECTION_STRING" -f "$file"
done

echo "Database migrations and seeding complete."
```