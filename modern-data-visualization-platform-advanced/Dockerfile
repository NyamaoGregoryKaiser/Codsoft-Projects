# Use a lightweight Python base image
FROM python:3.11-slim-buster

# Set environment variables
ENV PYTHONUNBUFFERED 1
ENV PYTHONDONTWRITEBYTECODE 1

# Set the working directory in the container
WORKDIR /app

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
COPY . /app

# Expose the port FastAPI will run on
EXPOSE 8000

# Command to run the application
# Use gunicorn with uvicorn workers for production
# For development, just uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]