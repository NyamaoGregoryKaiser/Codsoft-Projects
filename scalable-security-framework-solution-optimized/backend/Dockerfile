```dockerfile
# Stage 1: Builder
FROM python:3.10-slim-buster AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy only requirements.txt and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Stage 2: Final image
FROM python:3.10-slim-buster

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy installed packages from builder stage
COPY --from=builder /usr/local/lib/python3.10/site-packages /usr/local/lib/python3.10/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy the rest of the application code
COPY ./app /app/app
COPY ./alembic /app/alembic
COPY ./scripts /app/scripts
COPY ./uvicorn_log_config.json /app/uvicorn_log_config.json
COPY alembic.ini /app/alembic.ini

# Expose the port FastAPI runs on
EXPOSE 8000

# Set environment variables for production
ENV PYTHONUNBUFFERED 1
ENV APP_ENVIRONMENT=production

# Command to run the application using Gunicorn for production
# Gunicorn handles multiple Uvicorn workers for concurrency
CMD ["gunicorn", "app.main:app", "--workers", "4", "--worker-class", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000", "--log-config", "uvicorn_log_config.json"]
```