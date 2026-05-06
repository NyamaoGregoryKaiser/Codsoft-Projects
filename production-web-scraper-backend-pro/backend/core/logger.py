```python
import sys
from loguru import logger
from backend.core.config import settings

logger.remove()
logger.add(
    sys.stderr,
    level=settings.LOG_LEVEL,
    colorize=True,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>"
)

# Optional: Add a file sink for production environments
# logger.add(
#     "logs/app.log",
#     rotation="5 MB",
#     retention="10 days",
#     level=settings.LOG_LEVEL,
#     format="{time:YYYY-MM-DD HH:mm:ss.SSS} | {level: <8} | {name}:{function}:{line} - {message}"
# )
```