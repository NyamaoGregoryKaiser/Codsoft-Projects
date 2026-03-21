```dockerfile
# Stage 1: Builder
FROM python:3.10-slim-buster AS builder

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy only requirements.txt and install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Stage 2: Runtime
FROM python:3.10-slim-buster

WORKDIR /app

# Copy installed packages from builder stage
COPY --from=builder /usr/local/lib/python3.10/site-packages /usr/local/lib/python3.10/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Install minimal runtime dependencies if needed, e.g., libpq for psycopg2
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Copy the rest of the application code
COPY backend/app ./app
COPY backend/alembic ./alembic
COPY backend/alembic.ini .
COPY backend/scripts ./scripts

# Expose port for FastAPI
EXPOSE 8000

# Set environment variables for FastAPI and Uvicorn
ENV PYTHONUNBUFFERED 1
ENV FASTAPI_ENV production
ENV LOG_LEVEL info

# Command to run the application (using Gunicorn for production, Uvicorn for local dev/simplicity)
# For production, consider Gunicorn with Uvicorn workers:
# CMD ["gunicorn", "app.main:app", "--workers", "4", "--worker-class", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000"]
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```