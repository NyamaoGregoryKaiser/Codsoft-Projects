```bash
#!/bin/bash
set -e

DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USER:-zenith_user}
DB_PASSWORD=${DB_PASSWORD:-password}
DB_NAME=${DB_NAME:-zenith_db}
SCHEMA_FILE="./database/schema.sql"
MIGRATIONS_DIR="./database/migrations"
SEED_DATA_FILE="./database/seed_data.sql"

echo "Applying database schema..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $SCHEMA_FILE

echo "Applying database migrations..."
# Check for migrations table first
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "CREATE TABLE IF NOT EXISTS schema_migrations (id SERIAL PRIMARY KEY, migration_name VARCHAR(255) UNIQUE NOT NULL, applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP);"

for migration_file in $(ls $MIGRATIONS_DIR/*.sql | sort); do
    MIGRATION_NAME=$(basename "$migration_file")
    echo "  Checking migration: $MIGRATION_NAME"

    # Check if migration has already been applied
    MIGRATION_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM schema_migrations WHERE migration_name = '$MIGRATION_NAME';")

    if [ "$MIGRATION_COUNT" -eq 0 ]; then
        echo "  Applying $MIGRATION_NAME..."
        PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$migration_file"
        # The migration file itself should insert into schema_migrations, but as a fallback/check:
        # PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "INSERT INTO schema_migrations (migration_name) VALUES ('$MIGRATION_NAME');"
        echo "  Migration $MIGRATION_NAME applied successfully."
    else
        echo "  Migration $MIGRATION_NAME already applied. Skipping."
    fi
done

echo "Applying seed data..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $SEED_DATA_FILE

echo "Database setup and migrations complete!"
```