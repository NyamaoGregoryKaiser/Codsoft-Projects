# Use a slim Python image for a smaller final image
FROM python:3.11-slim-buster

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Install system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc postgresql-client libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements file and install dependencies
COPY requirements.txt /app/
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# Copy project files
COPY . /app/

# Create a directory for logs
RUN mkdir -p /app/logs

# Collect static files (for production)
# This will be done by docker-compose for dev, but good to have in Dockerfile
# if running a single container for prod without a separate static server like Nginx
RUN python manage.py collectstatic --noinput --clear

# Expose the port the app runs on
EXPOSE 8000

# Command to run the application (Gunicorn for production)
# For development, you might override this with `python manage.py runserver 0.0.0.0:8000`
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000"]