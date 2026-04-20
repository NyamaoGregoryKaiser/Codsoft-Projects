from loguru import logger
from app.core.config import settings
import sys

# Remove default handler
logger.remove()

# Add a new handler for console output
logger.add(
    sys.stderr,
    level=settings.LOG_LEVEL,
    format="{time} {level} {message}",
    colorize=True,
    backtrace=True,
    diagnose=True
)

# Optional: Add a file handler for persistent logs
# logger.add(
#     "logs/file_{time}.log",
#     level="INFO",
#     rotation="1 week", # Rotate log file every week
#     compression="zip", # Compress old logs
#     enqueue=True, # Use a separate thread for logging to avoid blocking
#     backtrace=True,
#     diagnose=True
# )

def get_logger():
    return logger