```python
import os
import subprocess
import sys

# Add backend directory to sys.path to allow imports from app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.logging import logger, configure_logging
from app.core.config import settings

def run_alembic_command(command: str):
    """Executes an Alembic command."""
    logger.info(f"Running Alembic command: {command}")
    try:
        # Pass DATABASE_URL as an environment variable to alembic
        # or rely on alembic.ini loading from .env
        env = os.environ.copy()
        env["DATABASE_URL"] = str(settings.DATABASE_URL)
        
        result = subprocess.run(
            ["alembic"] + command.split(),
            cwd=os.path.join(os.path.dirname(__file__), '..'), # Run alembic from backend root
            check=True,
            capture_output=True,
            text=True,
            env=env
        )
        logger.info(result.stdout)
        if result.stderr:
            logger.warning(result.stderr)
        logger.info(f"Alembic command '{command}' completed successfully.")
    except subprocess.CalledProcessError as e:
        logger.error(f"Alembic command '{command}' failed.",
                     stdout=e.stdout, stderr=e.stderr, returncode=e.returncode, exc_info=True)
        sys.exit(1)
    except FileNotFoundError:
        logger.error("Alembic command not found. Is Alembic installed and in PATH?", exc_info=True)
        sys.exit(1)

def main():
    configure_logging(settings.ENVIRONMENT) # Ensure logging is configured
    logger.info("Starting Alembic migrations...")

    # You can add logic here to decide which command to run
    # For example, to only upgrade to head:
    run_alembic_command("upgrade head")
    logger.info("Alembic migrations finished.")

if __name__ == "__main__":
    main()
```