# Use a Python base image
FROM python:3.10-slim-buster

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV DJANGO_SETTINGS_MODULE=cms_project.settings.production # Default to production settings

# Create and set working directory
WORKDIR /app

# Install system dependencies (needed for psycopg2 and Pillow)
RUN apt-get update && apt-get install -y \
    postgresql-client \
    libpq-dev \
    gcc \
    libjpeg-dev \
    zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# Copy project
COPY . .

# Collect static files
# This needs to be done before running the server, often in the entrypoint or build process
# For Dockerfile context, this ensures static files are present in the image
# It will use STATIC_ROOT specified in settings.
RUN python manage.py collectstatic --noinput

# Expose port (Gunicorn default)
EXPOSE 8000

# Run entrypoint script
ENTRYPOINT ["/app/entrypoint.sh"]

```

#### `backend/entrypoint.sh`

```bash