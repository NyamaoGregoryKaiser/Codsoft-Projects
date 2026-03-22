import logging
import sys
from app.core.config import settings

def setup_logging(name: str) -> logging.Logger:
    """
    Configures and returns a logger with a console handler.
    """
    logger = logging.getLogger(name)
    logger.setLevel(settings.LOG_LEVEL.upper())

    # Ensure handlers are not duplicated if called multiple times
    if not logger.handlers:
        formatter = logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        )

        # Console Handler
        ch = logging.StreamHandler(sys.stdout)
        ch.setFormatter(formatter)
        logger.addHandler(ch)

    return logger
```