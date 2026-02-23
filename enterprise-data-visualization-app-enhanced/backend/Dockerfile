```dockerfile
# Use a slim Python image for smaller size
FROM python:3.10-slim-buster

# Set environment variables
ENV PYTHONUNBUFFERED 1
ENV FLASK_APP=wsgi.py
ENV FLASK_ENV=production

# Install system dependencies for psycopg2-binary (PostgreSQL client)
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        libpq-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set working directory in the container
WORKDIR /app/backend

# Copy requirements.txt and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Expose the port Flask runs on
EXPOSE 5000

# Command to run the application using Gunicorn
# Using 4 workers (2 * CPU_CORES + 1 is a common heuristic, adjust as needed)
# Bind to 0.0.0.0 to make it accessible from outside the container
# --log-level info: Set logging level
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "wsgi:app"]

```