import logging
import sys
import json

class JsonFormatter(logging.Formatter):
    """
    A custom logging formatter that outputs logs as JSON.
    """
    def format(self, record):
        log_record = {
            "timestamp": datetime.fromtimestamp(record.created, tz=UTC).isoformat(),
            "level": record.levelname,
            "name": record.name,
            "message": record.getMessage(),
            "filename": record.filename,
            "lineno": record.lineno,
            "pathname": record.pathname,
            "funcName": record.funcName,
            "process": record.process,
            "thread": record.thread,
        }
        if record.exc_info:
            log_record["exc_info"] = self.formatException(record.exc_info)
        if record.stack_info:
            log_record["stack_info"] = self.formatStack(record.stack_info)
        # Add any extra attributes passed to the logger
        for key, value in record.__dict__.items():
            if key not in log_record and not key.startswith('_') and key not in ['args', 'asctime', 'created', 'levelname', 'levelno', 'exc_text', 'funcName', 'lineno', 'msecs', 'msg', 'name', 'pathname', 'process', 'processName', 'relativeCreated', 'stack_info', 'thread', 'threadName']:
                log_record[key] = value
        return json.dumps(log_record)

from datetime import datetime, UTC

def setup_logging():
    """
    Configures a root logger to output structured JSON logs to stdout.
    """
    # Create logger
    logger = logging.getLogger("auth_system")
    logger.setLevel(logging.INFO)

    # Prevent adding multiple handlers if setup_logging is called multiple times
    if not logger.handlers:
        # Create console handler
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(logging.INFO)

        # Create formatter and add it to handler
        formatter = JsonFormatter()
        console_handler.setFormatter(formatter)

        # Add the handler to the logger
        logger.addHandler(console_handler)

    return logger

logger = setup_logging()
```