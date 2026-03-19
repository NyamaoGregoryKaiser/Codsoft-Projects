```python
import logging
from logging.handlers import RotatingFileHandler
import os

def setup_logging(app):
    """
    Sets up logging for the Flask application.
    """
    if not app.debug and not app.testing:
        # Create log directory if it doesn't exist
        log_dir = os.path.dirname(app.config['LOG_FILE_PATH'])
        if not os.path.exists(log_dir):
            os.makedirs(log_dir)

        # File handler for general logs
        file_handler = RotatingFileHandler(
            app.config['LOG_FILE_PATH'],
            maxBytes=app.config['LOG_MAX_BYTES'],
            backupCount=app.config['LOG_BACKUP_COUNT']
        )
        file_handler.setFormatter(logging.Formatter(
            '%(asctime)s [%(levelname)s] %(module)s.%(funcName)s: %(message)s'
        ))
        app.logger.addHandler(file_handler)

        # Set log level
        app.logger.setLevel(getattr(logging, app.config['LOG_LEVEL'].upper(), logging.INFO))

        # Disable default Flask logger (optional, if you want full control)
        app.logger.propagate = False

        # Add console handler for production for better visibility
        stream_handler = logging.StreamHandler()
        stream_handler.setFormatter(logging.Formatter(
            '%(asctime)s [%(levelname)s] %(module)s.%(funcName)s: %(message)s'
        ))
        app.logger.addHandler(stream_handler)

    # For development/testing, Flask's default console logging is often sufficient
    # but still set the level based on config
    app.logger.setLevel(getattr(logging, app.config['LOG_LEVEL'].upper(), logging.DEBUG))

```