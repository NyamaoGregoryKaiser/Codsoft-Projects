```python
import logging
import sys
from app.core.config import settings

def setup_logging():
    log_level = logging.INFO if settings.APP_ENV == "production" else logging.DEBUG
    logging.basicConfig(
        level=log_level,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        handlers=[
            logging.StreamHandler(sys.stdout)
        ]
    )
    # Silence noisy loggers if needed
    logging.getLogger("uvicorn").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.INFO if settings.APP_ENV == "development" else logging.WARNING)

logger = logging.getLogger("payment_processor")
```