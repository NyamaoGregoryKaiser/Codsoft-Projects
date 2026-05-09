```bash
#!/bin/bash
set -e

echo "Running Alembic migrations..."
alembic upgrade head

echo "Initializing database with seed data..."
python -c "from app.db.session import SessionLocal; from app.db.init_db import init_db; db = SessionLocal(); init_db(db); db.close()"

echo "Starting FastAPI application with Uvicorn..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
```