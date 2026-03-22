# Use a slim Python base image
FROM python:3.11-slim-buster

# Set working directory in the container
WORKDIR /app

# Install system dependencies needed for psycopg2 (PostgreSQL adapter)
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    gcc \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# Copy requirements file and install Python dependencies
COPY ./requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY ./app /app/app
COPY ./alembic /app/alembic
COPY ./alembic.ini /app/alembic.ini

# Expose the port the FastAPI application runs on
EXPOSE 8000

# Command to run the application (migrations handled by docker-compose for dev)
# For production, this might be `gunicorn -k uvicorn.workers.UvicornWorker -c gunicorn_conf.py app.main:app`
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```