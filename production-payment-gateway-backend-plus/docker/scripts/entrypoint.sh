```bash
#!/bin/bash
set -e

# Use wait-for-it to ensure DB and Redis are up
/usr/local/bin/wait-for-it.sh db:${DB_PORT} --timeout=60 --strict -- echo "PostgreSQL is up."
/usr/local/bin/wait-for-it.sh redis:${REDIS_PORT} --timeout=60 --strict -- echo "Redis is up."

echo "Running database migrations..."
# Assuming tools/setup_db.sh is copied into the app container or mounted
# For this example, let's copy it into the app container for simplicity.
# In a real setup, you might have a separate migration service or a build step that copies it.
# For now, let's execute directly from the local tools directory via a bind mount in docker-compose for dev,
# or ensure it's copied in the Dockerfile if running in production.
# Let's assume it's copied to /app/tools in the Dockerfile if building for production.
# For simplicity, we'll assume the script is placed at `/app/setup_db.sh` for this entrypoint.
# The Dockerfile already copies it, let's adjust for it.

# If setup_db.sh is in the main project folder and bind-mounted, use:
# CURRENT_DIR=$(dirname "$0")
# DB_SCRIPT_PATH="${CURRENT_DIR}/../../tools/setup_db.sh"
# PGPASSWORD=$DB_PASSWORD /bin/bash $DB_SCRIPT_PATH

# If copied into the container during Docker build (as per Dockerfile), use:
/bin/bash ./setup_db_in_container.sh # We'll create a minimal script for this.
                                     # Or, preferably, copy the /tools/setup_db.sh into /app/ during build
                                     # and call it like /app/setup_db.sh.

echo "Database migrations complete."

echo "Starting Zenith Payments application..."
exec ./zenith-payments
```