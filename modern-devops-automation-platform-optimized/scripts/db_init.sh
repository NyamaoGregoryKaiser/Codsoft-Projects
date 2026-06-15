```bash
#!/bin/bash
set -e

echo "Waiting for PostgreSQL to be ready..."
/usr/bin/wait-for-it.sh "$DB_HOST:$DB_PORT" -t 60 -- echo "PostgreSQL is up and running!"

echo "Initializing database schema..."

# Check if migrations directory exists and apply schema
if [ -d "/docker-entrypoint-initdb.d/migrations" ]; then
  # Find the latest schema file in the migrations directory
  LATEST_MIGRATION=$(ls -v /docker-entrypoint-initdb.d/migrations/*.sql | tail -n 1)
  if [ -n "$LATEST_MIGRATION" ]; then
    echo "Applying latest migration: $LATEST_MIGRATION"
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$LATEST_MIGRATION"
  else
    echo "No migration files found in /docker-entrypoint-initdb.d/migrations."
  fi
else
  echo "Migrations directory /docker-entrypoint-initdb.d/migrations not found. Skipping migrations."
fi

# Apply seed data if seed.sql exists
if [ -f "/docker-entrypoint-initdb.d/seed.sql" ]; then
  echo "Applying seed data from seed.sql..."
  psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "/docker-entrypoint-initdb.d/seed.sql"
else
  echo "Seed file /docker-entrypoint-initdb.d/seed.sql not found. Skipping seed data."
fi

echo "Database initialization complete."
```