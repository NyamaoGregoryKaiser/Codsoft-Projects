```python
import logging
from logging.handlers import RotatingFileHandler
import os

# Ensure the logs directory exists
LOG_DIR = "logs"
os.makedirs(LOG_DIR, exist_ok=True)

def setup_logging():
    log_file_path = os.path.join(LOG_DIR, "ml_utilities_system.log")

    # Clear existing handlers to prevent duplicate logging
    for handler in logging.root.handlers[:]:
        logging.root.removeHandler(handler)

    # Base configuration
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        handlers=[
            logging.StreamHandler(), # Output to console
            RotatingFileHandler(
                log_file_path,
                maxBytes=10485760, # 10 MB
                backupCount=5,
                encoding="utf8"
            )
        ]
    )

    # Suppress verbose loggers from libraries
    logging.getLogger("uvicorn").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("asyncio").setLevel(logging.WARNING)

    # Custom logger for the application
    app_logger = logging.getLogger("ml_utilities_system")
    app_logger.setLevel(logging.INFO)
    return app_logger

logger = setup_logging()
```