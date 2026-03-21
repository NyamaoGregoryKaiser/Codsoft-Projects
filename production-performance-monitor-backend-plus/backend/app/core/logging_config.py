from loguru import logger
import sys
from app.core.config import settings

def setup_logging():
    logger.remove()  # Remove default logger

    # Add a sink for console output
    logger.add(
        sys.stderr,
        level=settings.LOG_LEVEL,
        format="{time:YYYY-MM-DD HH:mm:ss.SSS} | {level: <8} | {name}:{function}:{line} - {message}",
        colorize=True,
    )

    # Add a sink for file output (optional, uncomment for file logging)
    # logger.add(
    #     "logs/file_{time}.log",
    #     level=settings.LOG_LEVEL,
    #     rotation="500 MB",  # Rotate file every 500 MB
    #     compression="zip",   # Compress old log files
    #     enqueue=True,        # Use a queue for writing to file (non-blocking)
    #     retention="10 days", # Delete logs older than 10 days
    # )

    logger.info(f"Logging initialized with level: {settings.LOG_LEVEL}")

# Example of using logger:
# from app.core.logging_config import logger
# logger.info("This is an info message")
# logger.error("This is an error message")