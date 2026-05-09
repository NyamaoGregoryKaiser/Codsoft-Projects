```python
import logging
from logging.handlers import RotatingFileHandler
import os

LOG_DIR = "logs"
LOG_FILE = os.path.join(LOG_DIR, "ecommerce_backend.log")

# Ensure the log directory exists
if not os.path.exists(LOG_DIR):
    os.makedirs(LOG_DIR)

def setup_logging(name: str) -> logging.Logger:
    """
    Sets up a logger with console and file handlers for the application.
    """
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO) # Default level, can be overridden by specific handlers

    # Prevent adding handlers multiple times if the function is called multiple times
    if not logger.handlers:
        # Console Handler
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.INFO)
        console_formatter = logging.Formatter(
            "%(levelname)s:     %(name)s - %(message)s"
        )
        console_handler.setFormatter(console_formatter)
        logger.addHandler(console_handler)

        # File Handler (Rotating)
        file_handler = RotatingFileHandler(
            LOG_FILE, maxBytes=10*1024*1024, backupCount=5 # 10MB per file, 5 backup files
        )
        file_handler.setLevel(logging.INFO)
        file_formatter = logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        )
        file_handler.setFormatter(file_formatter)
        logger.addHandler(file_handler)

        # Optional: Set a higher level for specific (e.g., noisy) modules if needed
        # logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
        # logging.getLogger("uvicorn.error").setLevel(logging.INFO)

    return logger

```