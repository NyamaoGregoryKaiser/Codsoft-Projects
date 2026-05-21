# Use the official Python image
FROM python:3.10-slim-buster

# Set environment variables
ENV PYTHONUNBUFFERED 1
ENV PYTHONDONTWRITEBYTECODE 1

# Install Poetry
RUN pip install poetry==1.8.2

# Set the working directory
WORKDIR /app/backend

# Copy project files
COPY pyproject.toml poetry.lock ./
COPY ./app /app/backend/app
COPY ./alembic /app/backend/alembic
COPY alembic.ini ./
COPY seed_db.py ./
COPY run.sh ./

# Install dependencies using Poetry
# We use --no-root to skip installing the package itself if it's not meant to be installed
# and --no-dev for production builds.
RUN poetry config virtualenvs.create false \
    && poetry install --no-dev --no-interaction --no-ansi

# Expose the port FastAPI runs on
EXPOSE 8000

# Make the run script executable
RUN chmod +x run.sh

# Command to run the application
# Use a custom run.sh to handle migrations and then start the server
ENTRYPOINT ["./run.sh"]