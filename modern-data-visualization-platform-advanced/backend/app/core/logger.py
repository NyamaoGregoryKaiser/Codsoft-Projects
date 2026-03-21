```python
import logging
from pythonjsonlogger import jsonlogger
import sys

from app.core.config import settings

def setup_logging():
    """
    Configures structured logging for the application.
    Logs to stdout and can be easily parsed by log aggregators.
    """
    logger = logging.getLogger()
    logger.setLevel(settings.LOG_LEVEL.upper())

    # Remove existing handlers to prevent duplicate logs if called multiple times
    if logger.hasHandlers():
        logger.handlers.clear()

    handler = logging.StreamHandler(sys.stdout)
    formatter = jsonlogger.JsonFormatter(settings.LOG_FORMAT)
    handler.setFormatter(formatter)
    logger.addHandler(handler)

    # Disable default uvicorn loggers to avoid duplicate/non-json logs
    uvicorn_access_logger = logging.getLogger("uvicorn.access")
    uvicorn_access_logger.handlers.clear()
    uvicorn_access_logger.propagate = False

    uvicorn_error_logger = logging.getLogger("uvicorn.error")
    uvicorn_error_logger.handlers.clear()
    uvicorn_error_logger.propagate = False

    # Also set log level for SQLAlchemy, http core etc.
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)

    logger.info(f"Logging initialized with level: {settings.LOG_LEVEL.upper()}")

```