import time
import os
import logging
import sys
from datetime import datetime, timedelta
import pytz

from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.interval import IntervalTrigger
from dotenv import load_dotenv

# Add the parent directory to the path so app can be imported
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from app.models import Monitor
from app.core.services import MonitorService
from app.extensions import db

load_dotenv() # Load .env variables

# Setup basic logging for the worker process
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
                    handlers=[
                        logging.FileHandler("logs/worker.log"),
                        logging.StreamHandler(sys.stdout)
                    ])
worker_logger = logging.getLogger(__name__)

def run_all_active_monitors():
    """
    Fetches all active monitors and schedules their checks.
    This function acts as the main polling loop for the worker.
    """
    with app.app_context():
        worker_logger.info("Worker: Starting a new round of monitor checks...")
        # Fetch active monitors
        active_monitors = Monitor.query.filter_by(is_active=True).all()

        for monitor in active_monitors:
            # Check if it's time to run this monitor based on its interval_seconds
            # and last_checked time. This ensures individual monitor intervals are respected.
            if not monitor.last_checked or (datetime.now(pytz.utc) - monitor.last_checked).total_seconds() >= monitor.interval_seconds:
                try:
                    MonitorService.run_monitor_check(monitor)
                    db.session.commit() # Commit after each monitor to ensure atomic updates
                except Exception as e:
                    db.session.rollback() # Rollback if something went wrong within a single monitor check
                    worker_logger.error(f"Error running check for monitor {monitor.name} (ID: {monitor.id}): {e}", exc_info=True)
            else:
                worker_logger.debug(f"Monitor {monitor.name} (ID: {monitor.id}) not due yet. Next check in ~{(monitor.last_checked + timedelta(seconds=monitor.interval_seconds) - datetime.now(pytz.utc)).total_seconds():.0f}s")

        worker_logger.info("Worker: Finished this round of monitor checks.")


if __name__ == '__main__':
    app = create_app()
    # Initialize DB for worker context
    with app.app_context():
        db.create_all() # Ensure tables exist, useful for fresh worker start
        db.session.close() # Close session immediately as APScheduler will handle contexts

    scheduler = BlockingScheduler(timezone=str(pytz.utc))
    # Schedule the main function to run at a fixed interval
    # The interval here (`WORKER_INTERVAL_SECONDS`) defines how often the worker *tries* to check *all* monitors.
    # Individual monitor intervals are then handled within `run_all_active_monitors`.
    scheduler.add_job(
        run_all_active_monitors,
        trigger=IntervalTrigger(seconds=app.config['WORKER_INTERVAL_SECONDS']),
        id='monitor_poller',
        name='Poll all active monitors',
        replace_existing=True
    )

    worker_logger.info(f"SynapseSense Worker started. Polling every {app.config['WORKER_INTERVAL_SECONDS']} seconds...")
    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        scheduler.shutdown()
        worker_logger.info("SynapseSense Worker shut down.")
```