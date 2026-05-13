# Use a lightweight official Python image
FROM python:3.11-slim-buster

# Set environment variables
ENV PYTHONUNBUFFERED 1
ENV PYTHONDONTWRITEBYTECODE 1

# Set the working directory in the container
WORKDIR /app

# Install system dependencies required for psycopg2-binary
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    gcc \
    # Clean up APT cache to reduce image size
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code
COPY . /app

# Expose the port FastAPI runs on
EXPOSE 8000

# Command to run the application (using Uvicorn)
# In production, consider using a process manager like Gunicorn with Uvicorn workers.
# For simplicity and Docker Compose, we run Uvicorn directly.
CMD ["sh", "-c", "alembic upgrade head && python seed_data.py && uvicorn app.main:app --host 0.0.0.0 --port 8000"]

# Command to run Celery worker (needs a separate service in docker-compose)
# CMD ["celery", "-A", "app.tasks.payment_tasks:celery_app", "worker", "--loglevel=info"]
```

#### `payment_processor/docker-compose.yml`
```yaml