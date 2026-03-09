# Use a slim Python image for smaller size
FROM python:3.9-slim-buster

# Set environment variables for non-interactive commands
ENV PYTHONUNBUFFERED 1
ENV PYTHONDONTWRITEBYTECODE 1

# Install system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        libpq-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements file and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code
COPY . /app

# For production, use Gunicorn with Uvicorn workers
# For development, you can use `uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`
# The `entrypoint.sh` handles running the correct command based on the service name.
ENTRYPOINT ["/app/entrypoint.sh"]

# Default command for the backend service, overridden by docker-compose for worker/flower
CMD ["web"]
```
---