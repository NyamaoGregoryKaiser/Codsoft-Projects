```python
import os
import sys
from sqlalchemy.orm import Session

# Add backend directory to sys.path to allow imports from app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db.session import SessionLocal
from app.db.init_db import init_db
from app.core.logging import logger, configure_logging
from app.core.config import settings

def seed() -> None:
    configure_logging(settings.ENVIRONMENT) # Ensure logging is configured
    logger.info("Starting database seeding...")
    db: Session = SessionLocal()
    try:
        init_db(db)
    except Exception as e:
        logger.error("Error during database seeding", error=str(e), exc_info=True)
        raise
    finally:
        db.close()
    logger.info("Database seeding finished.")

if __name__ == "__main__":
    seed()
```