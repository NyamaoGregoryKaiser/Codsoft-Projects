```dockerfile
# Use the official Python image as a base
FROM python:3.11-slim-buster

# Set the working directory in the container
WORKDIR /app

# Install system dependencies for psycopg2
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy only requirements.txt first to leverage Docker cache
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Set environment variables (production settings can be overridden by docker-compose or Kubernetes)
ENV PYTHONUNBUFFERED 1
ENV APP_ENV production

# Expose the port FastAPI runs on
EXPOSE 8000

# Command to run the application (using Uvicorn with Gunicorn for production)
# For development, you might use: CMD ["uvicorn", "app.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
CMD ["gunicorn", "app.api.main:app", "--workers", "4", "--worker-class", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000"]
```