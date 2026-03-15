```dockerfile
# Use an official Python runtime as a parent image
FROM python:3.10-slim-buster

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set the working directory in the container
WORKDIR /app/backend

# Install system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file and install Python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# Copy the rest of the application code
COPY . .

# Create a directory for logs
RUN mkdir -p logs

# Expose the port the app runs on
EXPOSE 8000

# Run collectstatic for static files (important for production)
# We will use Gunicorn to run the app in production, this is for setup.
# During dev, Django's runserver handles static files if DEBUG=True.
# In prod, Nginx/CloudFront serves static files from STATIC_ROOT and MEDIA_ROOT.
RUN python manage.py collectstatic --noinput

# Define the command to run your app
# CMD ["gunicorn", "cms_project.wsgi:application", "--bind", "0.0.0.0:8000"]
# For development purposes, you might use:
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
```