# Use an official Python runtime as a parent image
FROM python:3.10-slim-buster

# Set the working directory in the container
WORKDIR /app

# Install system dependencies for psycopg2 and other tools
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    netcat-traditional \
    && rm -rf /var/lib/apt/lists/*

# Copy the requirements file and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire application code
COPY . .

# Expose the port the app runs on
EXPOSE 5000

# Set environment variables
ENV PYTHONUNBUFFERED 1
ENV FLASK_APP wsgi.py
ENV FLASK_CONFIG production # Default to production in Docker, override with docker-compose/k8s

# Command to run the application using Gunicorn
# Use a simple health check command to ensure DB is up before starting Gunicorn
CMD ["sh", "-c", "until nc -z $DB_HOST $DB_PORT; do echo 'Waiting for database...'; sleep 1; done && gunicorn --bind 0.0.0.0:5000 wsgi:app"]
```