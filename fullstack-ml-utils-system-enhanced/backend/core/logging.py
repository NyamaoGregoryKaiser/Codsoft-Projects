```python
import os
from loguru import logger
from backend.core.config import settings

def setup_logging():
    logger.remove() # Remove default handler
    logger.add(
        os.path.join(settings.BASE_DIR, "logs/ml-toolbox.log"),
        level="INFO",
        rotation="10 MB",
        compression="zip",
        enqueue=True, # Use a separate thread for logging
        backtrace=True,
        diagnose=True,
    )
    logger.add(
        "sys.stderr",
        level="INFO" if settings.ENVIRONMENT != "development" else "DEBUG",
        colorize=True,
        format="<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>"
    )

    # Example of how to log specific modules with different levels
    # logger.opt(colors=True).info("Logging setup complete for <green>{app_name}</green>", app_name=settings.APP_NAME)
```