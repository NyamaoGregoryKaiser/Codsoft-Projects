```python
import multiprocessing
import os

# Gunicorn configuration for FastAPI
# https://fastapi.tiangolo.com/deployment/server-options/

# Workers: Number of worker processes.
# A common rule of thumb is `(2 * CPU_CORES) + 1`.
workers = int(os.environ.get("WEB_CONCURRENCY", multiprocessing.cpu_count() * 2 + 1))

# Worker Class: Use uvicorn's async worker.
worker_class = "uvicorn.workers.UvicornWorker"

# Bind: The address and port to bind to.
bind = "0.0.0.0:8000"

# Timeout: Workers silent for more than this many seconds are killed and restarted.
timeout = 120

# Access log format
accesslog = "-" # Output to stdout
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s"'

# Error log
errorlog = "-" # Output to stdout

# Log level
loglevel = "info"
```