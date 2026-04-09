```dockerfile
# Use a slim Python base image
FROM python:3.10-slim-buster

# Set environment variables
ENV PYTHONUNBUFFERED 1
ENV PYTHONDONTWRITEBYTECODE 1

# Set the working directory in the container
WORKDIR /app/backend

# Install system dependencies (optional, but sometimes needed for psycopg2-binary or other packages)
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Expose the port FastAPI runs on
EXPOSE 8000

# Command to run the application (development mode)
# In docker-compose, this will be overridden by the 'command' field.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```