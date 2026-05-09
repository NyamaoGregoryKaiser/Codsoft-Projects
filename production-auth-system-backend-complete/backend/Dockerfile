# Use a slim Python base image
FROM python:3.9-slim-buster

# Set environment variables
ENV PYTHONUNBUFFERED 1
ENV PYTHONDONTWRITEBYTECODE 1

# Set the working directory in the container
WORKDIR /app/backend

# Install system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY ./app /app/backend/app
COPY alembic.ini .
COPY migrations /app/backend/migrations
COPY .env.example .env # Copy .env.example as .env for local dev/testing inside container

# Expose the port FastAPI runs on
EXPOSE 8000

# Command to run the application using Uvicorn
# Use Gunicorn to manage Uvicorn workers in production for robustness
# For local development, uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload is sufficient
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```