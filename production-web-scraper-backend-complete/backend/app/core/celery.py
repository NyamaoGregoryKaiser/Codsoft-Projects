from celery import Celery

from app.core.config import settings

celery_app = Celery(
    "web_scraper",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["app.worker.tasks"] # Where your tasks are defined
)

celery_app.conf.update(
    task_track_started=True,
    task_acks_late=True, # Acknowledge tasks after they're done
    worker_prefetch_multiplier=1, # Don't prefetch too many tasks
    task_serializer='json',
    result_serializer='json',
    accept_content=['json'],
    timezone='UTC',
    enable_utc=True,
)
```
---