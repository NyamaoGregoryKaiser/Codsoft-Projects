#!/bin/sh

echo "Running Prisma migrations..."
npx prisma migrate deploy
echo "Prisma migrations complete."

# Check if we are in a production environment
if [ "$NODE_ENV" = "production" ]; then
    echo "Running Prisma seed for production..."
    # You might want to be careful with seeding in production.
    # This example assumes seed data is idempotent or safe to re-run.
    # In a real production scenario, you might have a separate seeding process.
    npm run prisma:seed
    echo "Prisma seeding complete."
fi

echo "Starting Node.js application..."
exec "$@"