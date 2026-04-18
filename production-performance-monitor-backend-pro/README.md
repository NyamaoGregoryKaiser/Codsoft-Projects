fastapi==0.111.0
uvicorn==0.30.1
SQLAlchemy==2.0.30
psycopg2-binary==2.9.9
alembic==1.13.1
pydantic==2.7.1
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.9 # For file uploads if needed, common dependency
redis==5.0.4
python-dotenv==1.0.1

# OpenTelemetry
opentelemetry-api==1.25.0
opentelemetry-sdk==1.25.0
opentelemetry-exporter-otlp==1.25.0
opentelemetry-instrumentation-fastapi==0.45b0
opentelemetry-instrumentation-sqlalchemy==0.45b0
opentelemetry-instrumentation-redis==0.45b0
opentelemetry-instrumentation-logging==0.45b0
opentelemetry-instrumentation-system-metrics==0.45b0
opentelemetry-instrumentation-requests==0.45b0
opentelemetry-semantic-conventions==1.25.0

# Prometheus
prometheus-client==0.20.0

# Testing
pytest==8.2.0
pytest-asyncio==0.23.6
httpx==0.27.0
locust==2.20.0