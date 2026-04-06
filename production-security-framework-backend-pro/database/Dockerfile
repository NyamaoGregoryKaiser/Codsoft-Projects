FROM postgres:16-alpine

LABEL author="Your Name"
LABEL description="PostgreSQL database for Secure C++ App"

ENV POSTGRES_DB=${DB_NAME:-secure_app_db}
ENV POSTGRES_USER=${DB_USER:-admin}
ENV POSTGRES_PASSWORD=${DB_PASSWORD:-secretpassword}

# Copy initialization scripts
COPY schema.sql /docker-entrypoint-initdb.d/
COPY seed.sql /docker-entrypoint-initdb.d/

# Expose the default PostgreSQL port
EXPOSE 5432

CMD ["postgres"]