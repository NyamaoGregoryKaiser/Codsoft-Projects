```bash
#!/bin/bash
set -e

# This script is a placeholder to show how to execute migrations inside the container.
# In a real scenario, you would copy your `tools/setup_db.sh` into the container
# and run it. For this simplified example, we'll run a few `psql` commands directly.

echo "Applying schema (if not already done via docker-entrypoint-initdb.d)..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f /docker-entrypoint-initdb.d/10-schema.sql || true

echo "Checking and creating schema_migrations table..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "CREATE TABLE IF NOT EXISTS schema_migrations (id SERIAL PRIMARY KEY, migration_name VARCHAR(255) UNIQUE NOT NULL, applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP);"

MIGRATIONS_DIR="/app/database/migrations" # Assuming migrations are copied here
if [ -d "$MIGRATIONS_DIR" ]; then
    for migration_file in $(ls "$MIGRATIONS_DIR"/*.sql | sort); do
        MIGRATION_NAME=$(basename "$migration_file")
        echo "  Checking migration: $MIGRATION_NAME"

        MIGRATION_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM schema_migrations WHERE migration_name = '$MIGRATION_NAME';")

        if [ "$MIGRATION_COUNT" -eq 0 ]; then
            echo "  Applying $MIGRATION_NAME..."
            psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$migration_file"
            # Note: The migration file should ideally handle its own insertion into schema_migrations.
            echo "  Migration $MIGRATION_NAME applied successfully."
        else
            echo "  Migration $MIGRATION_NAME already applied. Skipping."
        fi
    done
else
    echo "Warning: Migration directory $MIGRATIONS_DIR not found. Skipping migrations."
fi

echo "Applying seed data (if not already done via docker-entrypoint-initdb.d)..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f /docker-entrypoint-initdb.d/20-seed.sql || true
```