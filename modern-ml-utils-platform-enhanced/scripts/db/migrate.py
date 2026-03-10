```python
import sqlite3
import os
import re
import sys

DATABASE_PATH = os.path.join(os.path.dirname(__file__), '../../data/mlops_core.db')
MIGRATIONS_DIR = os.path.join(os.path.dirname(__file__), 'migrations')
SEED_DATA_PATH = os.path.join(os.path.dirname(__file__), 'seed.sql')

def get_db_connection(db_path):
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

def create_migrations_table(conn):
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS schema_migrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            version TEXT NOT NULL UNIQUE,
            applied_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
    """)
    conn.commit()
    print("Checked/created 'schema_migrations' table.")

def get_applied_migrations(conn):
    cursor = conn.cursor()
    cursor.execute("SELECT version FROM schema_migrations ORDER BY version;")
    return {row['version'] for row in cursor.fetchall()}

def apply_migration(conn, version, sql_content):
    cursor = conn.cursor()
    try:
        conn.execute("BEGIN;")
        cursor.executescript(sql_content)
        cursor.execute("INSERT INTO schema_migrations (version) VALUES (?)", (version,))
        conn.execute("COMMIT;")
        print(f"Applied migration: {version}")
        return True
    except sqlite3.Error as e:
        conn.execute("ROLLBACK;")
        print(f"Error applying migration {version}: {e}")
        return False

def migrate_database(db_path, migrations_dir):
    conn = get_db_connection(db_path)
    create_migrations_table(conn)
    applied_migrations = get_applied_migrations(conn)

    migration_files = sorted([f for f in os.listdir(migrations_dir) if f.endswith('.sql')])
    
    print(f"Found {len(migration_files)} migration files.")
    
    pending_migrations = []
    for filename in migration_files:
        version_match = re.match(r'(\d{3}_.+)\.sql', filename)
        if version_match:
            version = version_match.group(1)
            if version not in applied_migrations:
                pending_migrations.append((version, filename))
        else:
            print(f"Warning: Skipping {filename} as it does not match migration naming convention (e.g., 001_name.sql).")

    if not pending_migrations:
        print("No pending migrations to apply.")
        conn.close()
        return

    print(f"Applying {len(pending_migrations)} pending migrations...")
    for version, filename in pending_migrations:
        filepath = os.path.join(migrations_dir, filename)
        with open(filepath, 'r') as f:
            sql_content = f.read()
        apply_migration(conn, version, sql_content)
    
    conn.close()
    print("Database migration complete.")

def seed_database(db_path, seed_path):
    conn = get_db_connection(db_path)
    cursor = conn.cursor()
    try:
        with open(seed_path, 'r') as f:
            sql_content = f.read()
        
        # Disable foreign key checks for seeding, re-enable after
        # This is useful if seed data has circular dependencies or needs specific order
        cursor.execute("PRAGMA foreign_keys = OFF;")
        conn.executescript(sql_content)
        cursor.execute("PRAGMA foreign_keys = ON;")
        conn.commit()
        print(f"Seed data applied from {seed_path}")
    except sqlite3.Error as e:
        print(f"Error applying seed data: {e}")
    finally:
        conn.close()

def reset_database(db_path):
    if os.path.exists(db_path):
        os.remove(db_path)
        print(f"Removed existing database: {db_path}")
    else:
        print(f"No database found at {db_path} to remove.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python migrate.py [migrate|seed|reset|full]")
        sys.exit(1)

    command = sys.argv[1]

    if command == "migrate":
        migrate_database(DATABASE_PATH, MIGRATIONS_DIR)
    elif command == "seed":
        seed_database(DATABASE_PATH, SEED_DATA_PATH)
    elif command == "reset":
        reset_database(DATABASE_PATH)
    elif command == "full":
        reset_database(DATABASE_PATH)
        migrate_database(DATABASE_PATH, MIGRATIONS_DIR)
        seed_database(DATABASE_PATH, SEED_DATA_PATH)
    else:
        print(f"Unknown command: {command}")
        print("Usage: python migrate.py [migrate|seed|reset|full]")
    
    print(f"Database located at: {DATABASE_PATH}")
```