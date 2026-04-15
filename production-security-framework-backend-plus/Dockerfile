```dockerfile
# Use a slim Python base image
FROM python:3.10-slim-buster

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file and install dependencies
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . /app

# Ensure logs directory exists
RUN mkdir -p /app/logs
RUN touch /app/logs/app.log

# Expose port (default for Flask/Gunicorn)
EXPOSE 5000

# Command to run the application using Gunicorn
# Using manage.py means FLASK_APP is implicitly set.
# Number of workers can be tuned based on CPU cores: (2 * NUM_CORES) + 1
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "3", "manage:app"]
```