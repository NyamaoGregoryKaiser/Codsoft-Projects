```dockerfile
# Use an official Python runtime as a parent image
FROM python:3.11-slim-bullseye

# Set environment variables
ENV PYTHONUNBUFFERED 1
ENV PYTHONDONTWRITEBYTECODE 1

# Set the working directory in the container
WORKDIR /app/backend

# Install psycopg2-binary dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file and install dependencies
COPY ./requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . /app/backend

# Expose the port the app runs on
EXPOSE 8000

# Command to run the application
# Use start.sh to handle migrations and then run Uvicorn
CMD ["/app/backend/start.sh"]

```