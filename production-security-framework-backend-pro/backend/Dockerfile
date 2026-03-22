```dockerfile
# Stage 1: Builder
FROM python:3.11-slim-buster AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Stage 2: Runtime
FROM python:3.11-slim-buster AS runtime

WORKDIR /app

# Install runtime dependencies (if any are different or missing from builder)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy installed packages from builder stage
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy the rest of the application code
COPY ./app /app/app
COPY ./alembic /app/alembic
COPY alembic.ini /app/
COPY initial_data.py /app/

# Expose the port FastAPI runs on
EXPOSE 8000

# Command to run the application (migrations and then start server)
# The `command` in docker-compose.yml will override this for local dev
# For production, you might have a dedicated entrypoint script for migrations.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```