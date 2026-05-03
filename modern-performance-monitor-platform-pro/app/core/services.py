import requests
import json
from datetime import datetime
import pytz
import logging

from app.extensions import db
from app.models import Monitor, Metric, AlertRule, TriggeredAlert

logger = logging.getLogger(__name__)

class MonitorService:
    @staticmethod
    def run_monitor_check(monitor: Monitor):
        """
        Executes an HTTP check for a given monitor and records the metrics.
        Also evaluates alert rules based on the new metric.
        """
        start_time = datetime.now(pytz.utc)
        response_time_ms = 0.0
        status_code = 0
        response_size_bytes = 0
        error_message = None

        try:
            headers = json.loads(monitor.headers) if monitor.headers else {}
            body = json.loads(monitor.body) if monitor.body else None

            # Handle content-type for JSON bodies if not explicitly set
            if body and monitor.method in ['POST', 'PUT'] and 'Content-Type' not in headers:
                headers['Content-Type'] = 'application/json'

            logger.info(f"Checking monitor: {monitor.name} ({monitor.url}) Method: {monitor.method}")

            response = requests.request(
                method=monitor.method,
                url=monitor.url,
                headers=headers,
                json=body, # Use json parameter for automatic content-type if body is dict
                timeout=10 # 10 second timeout for requests
            )
            end_time = datetime.now(pytz.utc)

            response_time_ms = (end_time - start_time).total_seconds() * 1000
            status_code = response.status_code
            response_size_bytes = len(response.content)

            logger.info(f"Monitor {monitor.name} - Status: {status_code}, Response Time: {response_time_ms:.2f}ms")

        except requests.exceptions.Timeout:
            end_time = datetime.now(pytz.utc) # Capture end time even on timeout
            response_time_ms = (end_time - start_time).total_seconds() * 1000
            error_message = "Request timed out after 10 seconds."
            status_code = 408 # Request Timeout
            logger.warning(f"Monitor {monitor.name} timed out: {error_message}")
        except requests.exceptions.ConnectionError as e:
            error_message = f"Connection Error: {e}"
            status_code = 503 # Service Unavailable or bad gateway
            logger.error(f"Monitor {monitor.name} connection error: {error_message}")
        except requests.exceptions.RequestException as e:
            error_message = f"Request failed: {e}"
            status_code = 500 # Generic server error
            logger.error(f"Monitor {monitor.name} general request error: {error_message}")
        except json.JSONDecodeError as e:
            error_message = f"Invalid JSON in headers or body: {e}"
            status_code = 400 # Bad Request
            logger.error(f"Monitor {monitor.name} JSON parse error: {error_message}")
        except Exception as e:
            error_message = f"An unexpected error occurred: {e}"
            status_code = 500
            logger.error(f"Monitor {monitor.name} unexpected error: {error_message}", exc_info=True)

        new_metric = Metric(
            monitor_id=monitor.id,
            response_time_ms=response_time_ms,
            status_code=status_code,
            response_size_bytes=response_size_bytes,
            error_message=error_message,
            timestamp=datetime.now(pytz.utc) # Ensure timestamp is saved after check
        )
        db.session.add(new_metric)

        # Update monitor's last_checked time
        monitor.last_checked = new_metric.timestamp
        db.session.add(monitor)

        db.session.commit()
        db.session.refresh(new_metric) # Refresh to get ID for alert processing

        # Evaluate alert rules
        MonitorService.evaluate_alert_rules(monitor, new_metric)
        return new_metric

    @staticmethod
    def evaluate_alert_rules(monitor: Monitor, metric: Metric):
        """
        Evaluates active alert rules for a monitor against the latest metric.
        """
        active_rules = AlertRule.query.filter_by(monitor_id=monitor.id, is_active=True).all()
        for rule in active_rules:
            triggered = False
            message = ""
            metric_value_for_rule = None

            if rule.threshold_type == 'response_time_ms':
                metric_value_for_rule = metric.response_time_ms
                if rule.operator == '>':
                    triggered = metric.response_time_ms > rule.threshold_value
                elif rule.operator == '>=':
                    triggered = metric.response_time_ms >= rule.threshold_value
                elif rule.operator == '<':
                    triggered = metric.response_time_ms < rule.threshold_value
                elif rule.operator == '<=':
                    triggered = metric.response_time_ms <= rule.threshold_value
                elif rule.operator == '==':
                    triggered = metric.response_time_ms == rule.threshold_value
                elif rule.operator == '!=':
                    triggered = metric.response_time_ms != rule.threshold_value
                message = f"Response time {metric.response_time_ms:.2f}ms {rule.operator} {rule.threshold_value:.2f}ms"

            elif rule.threshold_type == 'status_code':
                metric_value_for_rule = metric.status_code
                rule_threshold_int = int(rule.threshold_value) # Status codes are integers
                if rule.operator == '>':
                    triggered = metric.status_code > rule_threshold_int
                elif rule.operator == '>=':
                    triggered = metric.status_code >= rule_threshold_int
                elif rule.operator == '<':
                    triggered = metric.status_code < rule_threshold_int
                elif rule.operator == '<=':
                    triggered = metric.status_code <= rule_threshold_int
                elif rule.operator == '==':
                    triggered = metric.status_code == rule_threshold_int
                elif rule.operator == '!=':
                    triggered = metric.status_code != rule_threshold_int
                message = f"Status code {metric.status_code} {rule.operator} {rule_threshold_int}"

            if triggered:
                # Check if there's an existing *unresolved* alert for this rule
                last_alert = TriggeredAlert.query.filter_by(rule_id=rule.id, status='triggered') \
                                                  .order_by(TriggeredAlert.triggered_at.desc()).first()

                if not last_alert: # Only trigger a new alert if no ongoing alert exists
                    new_alert = TriggeredAlert(
                        rule_id=rule.id,
                        monitor_id=monitor.id,
                        message=f"ALERT: {rule.name} for {monitor.name} - {message}",
                        metric_value=metric_value_for_rule,
                        triggered_at=metric.timestamp
                    )
                    db.session.add(new_alert)
                    db.session.commit()
                    logger.warning(f"ALERT TRIGGERED for Monitor {monitor.name}: {message}")
                else:
                    logger.info(f"Alert already active for rule {rule.name}. No new alert triggered.")
            else:
                # If metric is healthy and there was an active alert, resolve it
                last_alert = TriggeredAlert.query.filter_by(rule_id=rule.id, status='triggered') \
                                                  .order_by(TriggeredAlert.triggered_at.desc()).first()
                if last_alert:
                    last_alert.status = 'resolved'
                    db.session.add(last_alert)
                    db.session.commit()
                    logger.info(f"ALERT RESOLVED for Monitor {monitor.name} (Rule: {rule.name}).")
```