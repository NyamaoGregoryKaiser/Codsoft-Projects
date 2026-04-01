```dockerfile
# Use a slim Python image for smaller size
FROM python:3.9-slim-buster

# Set working directory
WORKDIR /app

# Install system dependencies for psycopg2 and other tools
RUN apt-get update && apt-get install -y \
    postgresql-client \
    gcc \
    python3-dev \
    musl-dev \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# Copy requirements.txt and install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend application code
COPY backend/app ./app
COPY backend/migrations ./migrations
COPY backend/alembic.ini .
COPY backend/seed_data.py .
COPY backend/entrypoint.sh .
COPY backend/gunicorn_conf.py . # Gunicorn configuration

# Make the entrypoint script executable
RUN chmod +x /app/entrypoint.sh

# Create directories for data storage and logs
RUN mkdir -p /app/data/storage /app/logs

# Expose port (if not handled by Gunicorn bind)
EXPOSE 8000

# Entrypoint script will run migrations and start the server
ENTRYPOINT ["/app/entrypoint.sh"]

# Command will be overridden by Gunicorn in entrypoint.sh
CMD ["gunicorn", "-k", "uvicorn.workers.UvicornWorker", "-c", "python:gunicorn_conf", "app.main:app"]
```