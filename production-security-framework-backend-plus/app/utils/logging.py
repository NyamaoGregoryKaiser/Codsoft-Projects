```python
import logging
from logging.handlers import RotatingFileHandler
import os
import json

class JSONFormatter(logging.Formatter):
    """Custom formatter to output logs in JSON format."""
    def format(self, record):
        log_record = {
            "timestamp": self.formatTime(record, self.datefmt),
            "level": record.levelname,
            "message": record.getMessage(),
            "logger": record.name,
            "pathname": record.pathname,
            "lineno": record.lineno,
            "process": record.process,
            "thread": record.thread,
        }
        if record.exc_info:
            log_record["exc_info"] = self.formatException(record.exc_info)
        if record.stack_info:
            log_record["stack_info"] = self.formatStack(record.stack_info)
        return json.dumps(log_record)

def setup_logging(app):
    """
    Sets up application logging with a file handler and console handler,
    using JSON formatting for file logs.
    """
    log_level_str = app.config.get('LOG_LEVEL', 'INFO').upper()
    log_level = getattr(logging, log_level_str, logging.INFO)

    # Remove default Flask handlers
    for handler in app.logger.handlers:
        app.logger.removeHandler(handler)

    # Set logger level
    app.logger.setLevel(log_level)
    logging.getLogger('werkzeug').setLevel(logging.WARNING) # Suppress werkzeug access logs
    logging.getLogger('sqlalchemy.engine').setLevel(logging.WARNING) # Suppress SQLAlchemy engine logs

    # Console Handler (for development and Docker output)
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(logging.Formatter(
        '[%(asctime)s] %(levelname)s in %(module)s: %(message)s'
    ))
    console_handler.setLevel(log_level)
    app.logger.addHandler(console_handler)

    # File Handler (for production)
    log_dir = os.path.dirname(app.config.get('LOG_FILE_PATH'))
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)

    file_handler = RotatingFileHandler(
        app.config.get('LOG_FILE_PATH'),
        maxBytes=app.config.get('LOG_MAX_BYTES'),
        backupCount=app.config.get('LOG_BACKUP_COUNT')
    )
    file_handler.setFormatter(JSONFormatter())
    file_handler.setLevel(log_level)
    app.logger.addHandler(file_handler)

    app.logger.info(f"Logging initialized with level: {log_level_str}")
    app.logger.info(f"Logs will be written to: {app.config.get('LOG_FILE_PATH')}")
```