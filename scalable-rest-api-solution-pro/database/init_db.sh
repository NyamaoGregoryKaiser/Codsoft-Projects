```bash
#!/bin/bash
# init_db.sh - Script to initialize and migrate the database

DB_PATH=${DB_PATH:-"database/project_management.db"}
MIGRATIONS_DIR=${MIGRATIONS_DIR:-"database/migrations"}
SEED_DIR=${SEED_DIR:-"database/seed"}

echo "Initializing/Migrating database at: $DB_PATH"
echo "Using migrations from: $MIGRATIONS_DIR"

# Ensure database directory exists
mkdir -p $(dirname "$DB_PATH")

# Create a migrations table if it doesn't exist
sqlite3 "$DB_PATH" <<EOF
CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    applied_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
EOF

# Apply migrations
for file in $(ls -v "$MIGRATIONS_DIR"/*.sql); do
    filename=$(basename "$file")
    version=$(echo "$filename" | grep -oP '^\d+')
    name=$(echo "$filename" | sed 's/^\d\+_//' | sed 's/\.sql$//')

    # Check if migration has already been applied
    MIGRATED=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM schema_migrations WHERE version = $version;")
    if [ "$MIGRATED" -eq 0 ]; then
        echo "Applying migration: $filename"
        sqlite3 "$DB_PATH" < "$file"
        if [ $? -eq 0 ]; then
            sqlite3 "$DB_PATH" "INSERT INTO schema_migrations (version, name) VALUES ($version, '$name');"
            echo "Migration $filename applied successfully."
        else
            echo "ERROR: Failed to apply migration $filename. Exiting."
            exit 1
        fi
    else
        echo "Migration $filename already applied. Skipping."
    fi
done

# Apply seed data if not already seeded (simple check by count of users)
SEED_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM users;")
if [ "$SEED_COUNT" -eq 0 ]; then
    echo "Applying seed data from $SEED_DIR/seed_data.sql"
    if [ -f "$SEED_DIR/seed_data.sql" ]; then
        sqlite3 "$DB_PATH" < "$SEED_DIR/seed_data.sql"
        if [ $? -eq 0 ]; then
            echo "Seed data applied successfully."
        else
            echo "ERROR: Failed to apply seed data. Exiting."
            exit 1
        fi
    else
        echo "WARNING: Seed data file '$SEED_DIR/seed_data.sql' not found."
    fi
else
    echo "Database already contains data (users exist). Skipping seed data."
fi

echo "Database initialization/migration complete."
```