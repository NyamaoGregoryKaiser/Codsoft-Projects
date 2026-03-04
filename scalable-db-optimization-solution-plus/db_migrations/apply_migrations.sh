```bash
#!/bin/bash

# Configuration for OptiDB's system database
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-optidb}
DB_USER=${DB_USER:-optidb_user}
DB_PASSWORD=${DB_PASSWORD:-optidb_password}

# Function to execute SQL
execute_sql() {
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -w -f "$1" -v ON_ERROR_STOP=1
    if [ $? -eq 0 ]; then
        echo "Successfully applied migration: $1"
    else
        echo "Error applying migration: $1"
        exit 1
    fi
}

echo "Applying database migrations to $DB_NAME on $DB_HOST:$DB_PORT..."

# Create database if it doesn't exist (only if user has superuser privileges or correct permissions)
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -w -c "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -w -c "CREATE DATABASE $DB_NAME OWNER $DB_USER"
if [ $? -eq 0 ]; then
    echo "Database '$DB_NAME' ensured."
else
    echo "Warning: Could not create database '$DB_NAME'. Ensure it exists or user '$DB_USER' has sufficient privileges."
fi


# Loop through SQL files in order
MIGRATION_DIR="./db_migrations"
find "$MIGRATION_DIR" -maxdepth 1 -type f -name 'V*.sql' | sort | while read -r migration_file; do
    execute_sql "$migration_file"
done

echo "All migrations applied."

# Optional: Seed data after migrations
# Assuming V2 adds seed data, so no separate seed script is needed if V2 covers it.
```