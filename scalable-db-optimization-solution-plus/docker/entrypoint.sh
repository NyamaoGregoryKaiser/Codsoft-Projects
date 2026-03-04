```bash
#!/bin/bash
set -e

# Load environment variables from .env if present
if [ -f .env ]; then
    echo "Loading environment variables from .env"
    export $(cat .env | xargs)
fi

# Set default values if not already set
export DB_HOST=${DB_HOST:-optidb_postgres} # Default to service name in docker-compose
export DB_PORT=${DB_PORT:-5432}
export DB_NAME=${DB_NAME:-optidb}
export DB_USER=${DB_USER:-optidb_user}
export DB_PASSWORD=${DB_PASSWORD:-optidb_password}
export SERVER_PORT=${SERVER_PORT:-18080}
export LOG_LEVEL=${LOG_LEVEL:-INFO}
export JWT_SECRET=${JWT_SECRET:-super_secret_jwt_key_that_should_be_long_and_random}
export JWT_EXPIRY_SECONDS=${JWT_EXPIRY_SECONDS:-3600}
export TARGET_DB_CONN_TIMEOUT_MS=${TARGET_DB_CONN_TIMEOUT_MS:-5000}
export TARGET_DB_MAX_CONN=${TARGET_DB_MAX_CONN:-5}

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL at $DB_HOST:$DB_PORT..."
until PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c '\q'; do
  >&2 echo "PostgreSQL is unavailable - sleeping"
  sleep 1
done
>&2 echo "PostgreSQL is up - executing migrations"

# Apply database migrations
/app/db_migrations/apply_migrations.sh

echo "Starting OptiDB application..."
# Execute the main application command passed as CMD
exec "$@"
```