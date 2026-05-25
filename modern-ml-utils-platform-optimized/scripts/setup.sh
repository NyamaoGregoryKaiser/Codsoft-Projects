#!/bin/bash

echo "Starting ML Utilities Hub setup..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "Docker is not running. Please start Docker and try again."
  exit 1
fi

# Create .env files if they don't exist
echo "Creating .env files if they don't exist..."
if [ ! -f ./backend/.env ]; then
  cp ./backend/.env.example ./backend/.env
  echo "Created backend/.env from .env.example"
fi

if [ ! -f ./frontend/.env ]; then
  cp ./frontend/.env.example ./frontend/.env
  echo "Created frontend/.env from .env.example"
fi

echo "Building and starting Docker containers..."
# Build and run containers in detached mode
docker compose up --build -d

# Wait for services to be healthy
echo "Waiting for database and Redis to be ready (up to 30 seconds)..."
sleep 10 # Give a base delay for services to start

# Check database connection in backend container and run migrations/seed
# Loop to wait for backend to be fully ready before proceeding with potential interactive commands
MAX_RETRIES=10
RETRY_COUNT=0
BACKEND_HEALTHY=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  echo "Attempt $((RETRY_COUNT+1)): Checking backend health..."
  # Example: Check if the backend process is running and port is open
  if docker compose exec backend sh -c "pg_isready -h db -p 5432 -U ml_user" && \
     docker compose logs backend 2>&1 | grep -q "Connected to PostgreSQL database"; then
    echo "Backend is up and connected to DB."
    BACKEND_HEALTHY=true
    break
  fi
  sleep 5
  RETRY_COUNT=$((RETRY_COUNT+1))
done

if [ "$BACKEND_HEALTHY" = false ]; then
  echo "Backend did not become healthy within the timeout. Please check logs for errors."
  exit 1
fi

echo "All services are up and running!"
echo "You can access the frontend at http://localhost:3000"
echo "You can access the backend API at http://localhost:5000/api/v1"
echo "To stop: docker compose down"
echo "To view logs: docker compose logs -f"
echo "To run tests: cd backend && npm test"