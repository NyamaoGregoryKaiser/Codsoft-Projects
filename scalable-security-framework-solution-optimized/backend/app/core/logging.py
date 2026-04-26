```python
import logging
import structlog
from structlog.stdlib import LoggerFactory
from structlog.dev import ConsoleRenderer
from structlog.processors import JSONRenderer

def configure_logging(environment: str):
    """
    Configures structured logging for the application.
    Uses structlog with JSON output for production, and console output for development.
    """
    if environment == "development":
        renderer = ConsoleRenderer(colors=True)
        processors = [
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.dev.set_exc_info,
            structlog.processors.CallsiteParameterAdder(
                {
                    structlog.processors.CallsiteParameter.FILENAME,
                    structlog.processors.CallsiteParameter.LINENO,
                }
            ),
            renderer,
        ]
        # For development, we want the logs to be readable in the console
        logging.basicConfig(level=logging.INFO, format="%(message)s")
    else: # Production or other environments
        renderer = JSONRenderer()
        processors = [
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.CallsiteParameterAdder(
                {
                    structlog.processors.CallsiteParameter.FILENAME,
                    structlog.processors.CallsiteParameter.LINENO,
                }
            ),
            renderer,
        ]
        # For production, we want JSON output
        logging.basicConfig(level=logging.INFO, format="%(message)s")

    structlog.configure(
        processors=processors,
        logger_factory=LoggerFactory(),
        cache_logger_on_first_use=False,
    )

    # Wrap standard library loggers with structlog
    logging.setLoggerClass(structlog.stdlib.BoundLogger)
    for name in ["uvicorn", "uvicorn.error", "uvicorn.access", "sqlalchemy", "alembic", "app"]:
        _logger = logging.getLogger(name)
        _logger.propagate = False
        _logger.setLevel(logging.INFO if "error" not in name else logging.ERROR)
        # Use a simple formatter for uvicorn access logs if JSON is too verbose
        # Or let structlog handle it, ensuring JSON output for everything
        if environment == "development" and name in ["uvicorn.access"]:
            _logger.handlers = [logging.StreamHandler()]
            _logger.handlers[0].setFormatter(logging.Formatter("%(message)s"))
        else:
            _logger.handlers = [logging.StreamHandler()]
            _logger.handlers[0].setFormatter(structlog.stdlib.ProcessorFormatter(processor=renderer))


logger = structlog.get_logger("app")
```