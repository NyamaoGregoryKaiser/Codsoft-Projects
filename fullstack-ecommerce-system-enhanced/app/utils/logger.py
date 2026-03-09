```python
import logging
import sys
from loguru import logger

class InterceptHandler(logging.Handler):
    """
    Intercepts standard logging messages and redirects them to Loguru.
    """
    def emit(self, record):
        # Get corresponding Loguru level if it exists
        try:
            level = logger.level(record.levelname).name
        except ValueError:
            level = record.levelno

        # Find Caller if possible
        frame, depth = logging.currentframe(), 2
        while frame.f_code.co_filename == logging.__file__:
            frame = frame.f_back
            depth += 1

        logger.opt(depth=depth, exception=record.exc_info).log(level, record.getMessage())

def customize_logging(
    level: str = "INFO",
    name: str = "ecommerce_system",
    json_format: bool = False,
    log_dir: str = "logs",
    file_size: str = "10 MB",
    rotation: str = "1 day"
):
    """
    Customizes logging using Loguru.
    Redirects standard logging to Loguru.
    Sets up console and file logging.
    """
    # Remove default logger
    logger.remove()

    # Add console logger
    logger.add(
        sys.stderr,
        level=level,
        format="{time} {level} {message}",
        colorize=True,
        backtrace=True,
        diagnose=True,
    )

    # Add file logger
    log_file_path = f"{log_dir}/{name}.log"
    logger.add(
        log_file_path,
        level=level,
        format="{time} {level} {message}",
        colorize=False,
        backtrace=True,
        diagnose=True,
        rotation=rotation, # New file every day
        retention="7 days", # Keep logs for 7 days
        compression="zip",  # Compress old log files
        enqueue=True,       # Use a queue for non-blocking logging
        json=json_format,
        serialize=json_format,
        # max_size=file_size # Use rotation instead of max_size for clearer file management
    )

    # Intercept standard logging messages (e.g., from SQLAlchemy, Uvicorn, etc.)
    # and redirect them to Loguru.
    logging.basicConfig(handlers=[InterceptHandler()], level=0)
    logging.getLogger("uvicorn.access").handlers = [InterceptHandler()]
    logging.getLogger("uvicorn.error").handlers = [InterceptHandler()]
    logging.getLogger("sqlalchemy.engine").handlers = [InterceptHandler()]
    # Optional: silence noisy loggers from libraries
    logging.getLogger("alembic").setLevel(logging.WARNING)
    logging.getLogger("asyncio").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)

```