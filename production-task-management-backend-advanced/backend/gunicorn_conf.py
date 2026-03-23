import os

workers = int(os.environ.get("GUNICORN_WORKERS", "4")) # Adjust based on CPU cores
worker_class = "uvicorn.workers.UvicornWorker"
bind = "0.0.0.0:8000"
timeout = int(os.environ.get("GUNICORN_TIMEOUT", "120"))
loglevel = os.environ.get("GUNICORN_LOGLEVEL", "info")
reload = bool(os.environ.get("GUNICORN_RELOAD", "false").lower() == "true") # For dev, set to true
capture_output = True # Redirect stdout/stderr to gunicorn log
enable_stdio_inheritance = True # Pass stdin/out to workers