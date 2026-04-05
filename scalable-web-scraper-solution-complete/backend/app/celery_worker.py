from app.services.task_scheduler import celery_app, scrape_task_by_id
from loguru import logger

# Add logging specifically for Celery worker
logger.add("celery_worker.log", rotation="50 MB", compression="zip", level="INFO")
logger.info("Celery worker started, loading tasks...")

# Ensure tasks are registered with the Celery app
# (scrape_task_by_id is already registered in task_scheduler.py with @celery_app.task)

# To run this worker:
# cd backend
# celery -A app.celery_worker worker -l info -P eventlet
# (-P eventlet is recommended for async tasks that perform I/O like HTTP requests and DB calls)

if __name__ == "__main__":
    # If this file is executed directly, run the Celery worker
    celery_app.worker_main(['worker', '-l', 'info', '-P', 'eventlet'])
```