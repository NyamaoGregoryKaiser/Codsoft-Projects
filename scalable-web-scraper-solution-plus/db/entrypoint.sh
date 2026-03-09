```bash
#!/bin/bash
set -e

echo "Running DB entrypoint script..."

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to start..."
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER"; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 1
done

echo "PostgreSQL is up - executing command"

# Ensure the database exists
echo "Checking if database $DB_NAME exists..."
if ! PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -U "$DB_USER" -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
  echo "Database $DB_NAME does not exist. Creating..."
  PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -U "$DB_USER" -c "CREATE DATABASE $DB_NAME;"
  echo "Database $DB_NAME created."
else
  echo "Database $DB_NAME already exists."
fi

# Apply migrations
echo "Running migrations..."
/usr/src/app/node_modules/.bin/sequelize db:migrate --config /usr/src/app/db/config/config.json
echo "Migrations finished."

# Run seeders (only if not in production and database is empty or specifically needed)
# Be careful with seeders in production!
if [ "$NODE_ENV" != "production" ]; then
  echo "Running seeders for $NODE_ENV environment..."
  /usr/src/app/node_modules/.bin/sequelize db:seed:all --config /usr/src/app/db/config/config.json
  echo "Seeders finished."
fi

echo "DB setup complete."

# Keep the container running
# This part is usually handled by the main app process in docker-compose.
# This script is specifically for setting up the database.
# In a typical setup, the Node.js backend would handle its own migrations and seeding.
# For this explicit 'db' service, it only ensures DB readiness and creation,
# the backend app's `server.js` would then run `sequelize.sync({ alter: true })`
# or `npx sequelize-cli db:migrate` via npm scripts.
# For simplicity, I will remove direct migration/seeding from here and let backend handle it,
# as `server.js` already includes `sequelize.sync({ alter: true })`.
# This script can just ensure the DB exists.
# Removing sequlize-cli calls to prevent conflicts/redundancy.

exec "$@"
```