```bash
#!/bin/sh
# pre-start.sh

set -e

echo "Waiting for PostgreSQL to be ready..."
# Loop until `pg_isready` succeeds
until pg_isready -h db -p 5432 -U user; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 1
done

echo "PostgreSQL is up - executing command"

# Apply Prisma migrations
echo "Running Prisma migrations..."
npx prisma migrate deploy

# Seed the database
echo "Running Prisma seed script..."
npx prisma db seed

echo "Starting Node.js application..."
exec node dist/app.js
```