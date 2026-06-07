```python
import logging
import sys
from app.core.config import settings

def setup_logging():
    """
    Configures the application's logging system.
    Sets up a console handler and a file handler (optional).
    Logs at INFO level by default, configurable via settings.
    """
    # Create a custom logger
    logger = logging.getLogger()
    logger.setLevel(settings.LOG_LEVEL.upper())

    # Clear existing handlers to prevent duplicate logs in case of re-configuration
    if logger.hasHandlers():
        logger.handlers.clear()

    # Create formatter
    formatter = logging.Formatter(settings.LOG_FORMAT)

    # Create console handler and set level
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(settings.LOG_LEVEL.upper())
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    # Optionally, create a file handler
    # For a real production system, consider a more robust log rotation solution like 'logging.handlers.RotatingFileHandler'
    # or sending logs to a centralized logging service (ELK stack, Splunk, etc.)
    # if settings.LOG_TO_FILE: # Assuming a setting like this
    #     file_handler = logging.FileHandler("app.log")
    #     file_handler.setLevel(settings.LOG_LEVEL.upper())
    #     file_handler.setFormatter(formatter)
    #     logger.addHandler(file_handler)

    # Suppress verbose loggers from libraries if needed
    logging.getLogger("uvicorn").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    logging.getLogger("aioredis").setLevel(logging.WARNING)
    logging.getLogger("asyncio").setLevel(logging.WARNING)


# This ensures logging is set up when the module is imported
# However, for FastAPI's lifespan, it's called explicitly in main.py
# to ensure it runs before other app components initialize.
# setup_logging()
```