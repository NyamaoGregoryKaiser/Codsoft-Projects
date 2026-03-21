```dockerfile
# Use a Python base image
FROM python:3.11-slim-buster

# Set working directory
WORKDIR /app/backend

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Create data directories with appropriate permissions
RUN mkdir -p /app/data/uploads /app/data/models && \
    chmod -R 777 /app/data # WARNING: 777 is for demonstration ease. Use more restrictive permissions in production.

# Expose the port FastAPI runs on
EXPOSE 8000

# Command to run the application
# Use gunicorn for production, uvicorn for development
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```