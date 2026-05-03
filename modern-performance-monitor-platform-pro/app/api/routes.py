from flask import Blueprint, request, jsonify, abort
from flask_login import login_required, current_user
import json
from datetime import datetime, timedelta
import pytz
from sqlalchemy import desc

from app.extensions import db, limiter
from app.models import User, Project, Monitor, Metric, AlertRule, TriggeredAlert
from app.api.schemas import (
    user_schema, users_schema,
    project_schema, projects_schema, project_with_monitors_schema,
    monitor_schema, monitors_schema, monitor_with_details_schema,
    metric_schema, metrics_schema,
    alert_rule_schema, alert_rules_schema,
    triggered_alert_schema, triggered_alerts_schema
)

api_bp = Blueprint('api', __name__)

# Helper for API authentication (could be JWT for stateless API, but using session for consistency)
def api_login_required(f):
    def wrapper(*args, **kwargs):
        if not current_user.is_authenticated:
            abort(401, description="Authentication required.")
        return f(*args, **kwargs)
    return wrapper

# --- Projects API ---
@api_bp.route('/projects', methods=['GET'])
@api_login_required
@limiter.limit("60 per minute")
def get_projects():
    """Get all projects for the current user."""
    projects = current_user.projects.all()
    return jsonify(projects_schema.dump(projects)), 200

@api_bp.route('/projects/<int:project_id>', methods=['GET'])
@api_login_required
def get_project(project_id):
    """Get a single project by ID."""
    project = db.session.get(Project, project_id)
    if not project or project.user_id != current_user.id:
        abort(404, description="Project not found or not owned by user.")
    return jsonify(project_with_monitors_schema.dump(project)), 200

@api_bp.route('/projects', methods=['POST'])
@api_login_required
def create_project():
    """Create a new project."""
    data = request.get_json()
    if not data or not 'name' in data:
        abort(400, description="Missing 'name' in request body.")

    # Validate uniqueness for the current user
    if Project.query.filter_by(name=data['name'], user_id=current_user.id).first():
        abort(409, description="A project with this name already exists for your account.")

    project = Project(name=data['name'], description=data.get('description'), user_id=current_user.id)
    db.session.add(project)
    db.session.commit()
    return jsonify(project_schema.dump(project)), 201

@api_bp.route('/projects/<int:project_id>', methods=['PUT'])
@api_login_required
def update_project(project_id):
    """Update an existing project."""
    project = db.session.get(Project, project_id)
    if not project or project.user_id != current_user.id:
        abort(404, description="Project not found or not owned by user.")

    data = request.get_json()
    if not data:
        abort(400, description="No data provided for update.")

    if 'name' in data:
        # Check for unique name during update
        existing_project = Project.query.filter_by(name=data['name'], user_id=current_user.id).first()
        if existing_project and existing_project.id != project_id:
            abort(409, description="A project with this name already exists for your account.")
        project.name = data['name']
    if 'description' in data:
        project.description = data['description']

    db.session.commit()
    return jsonify(project_schema.dump(project)), 200

@api_bp.route('/projects/<int:project_id>', methods=['DELETE'])
@api_login_required
def delete_project(project_id):
    """Delete a project."""
    project = db.session.get(Project, project_id)
    if not project or project.user_id != current_user.id:
        abort(404, description="Project not found or not owned by user.")

    db.session.delete(project)
    db.session.commit()
    return jsonify({'message': 'Project deleted successfully'}), 204

# --- Monitors API ---
@api_bp.route('/projects/<int:project_id>/monitors', methods=['GET'])
@api_login_required
def get_monitors_for_project(project_id):
    """Get all monitors for a specific project."""
    project = db.session.get(Project, project_id)
    if not project or project.user_id != current_user.id:
        abort(404, description="Project not found or not owned by user.")
    monitors = project.monitors.all()
    return jsonify(monitors_schema.dump(monitors)), 200

@api_bp.route('/monitors/<int:monitor_id>', methods=['GET'])
@api_login_required
def get_monitor(monitor_id):
    """Get a single monitor by ID."""
    monitor = db.session.get(Monitor, monitor_id)
    if not monitor or monitor.project.user_id != current_user.id:
        abort(404, description="Monitor not found or not owned by user.")
    return jsonify(monitor_with_details_schema.dump(monitor)), 200

@api_bp.route('/projects/<int:project_id>/monitors', methods=['POST'])
@api_login_required
def create_monitor(project_id):
    """Create a new monitor within a project."""
    project = db.session.get(Project, project_id)
    if not project or project.user_id != current_user.id:
        abort(404, description="Project not found or not owned by user.")

    data = request.get_json()
    if not data or not all(k in data for k in ['name', 'url']):
        abort(400, description="Missing required fields: 'name', 'url'.")

    # Validate uniqueness for the current project
    if Monitor.query.filter_by(name=data['name'], project_id=project_id).first():
        abort(409, description="A monitor with this name already exists in this project.")

    # Validate JSON fields
    headers_json = '{}'
    if 'headers' in data and data['headers']:
        try:
            json.dumps(data['headers']) # Validate if it's JSON serializable
            headers_json = json.dumps(data['headers'])
        except TypeError:
            abort(400, description="Invalid JSON format for 'headers'.")

    body_json = '{}'
    if 'body' in data and data['body']:
        try:
            json.dumps(data['body']) # Validate if it's JSON serializable
            body_json = json.dumps(data['body'])
        except TypeError:
            abort(400, description="Invalid JSON format for 'body'.")

    monitor = Monitor(
        name=data['name'],
        url=data['url'],
        method=data.get('method', 'GET'),
        headers=headers_json,
        body=body_json,
        interval_seconds=data.get('interval_seconds', 60),
        is_active=data.get('is_active', True),
        project=project
    )
    db.session.add(monitor)
    db.session.commit()
    return jsonify(monitor_schema.dump(monitor)), 201

@api_bp.route('/monitors/<int:monitor_id>', methods=['PUT'])
@api_login_required
def update_monitor(monitor_id):
    """Update an existing monitor."""
    monitor = db.session.get(Monitor, monitor_id)
    if not monitor or monitor.project.user_id != current_user.id:
        abort(404, description="Monitor not found or not owned by user.")

    data = request.get_json()
    if not data:
        abort(400, description="No data provided for update.")

    if 'name' in data:
        existing_monitor = Monitor.query.filter_by(name=data['name'], project_id=monitor.project_id).first()
        if existing_monitor and existing_monitor.id != monitor_id:
            abort(409, description="A monitor with this name already exists in this project.")
        monitor.name = data['name']
    if 'url' in data:
        monitor.url = data['url']
    if 'method' in data:
        monitor.method = data['method']
    if 'headers' in data:
        try:
            json.dumps(data['headers'])
            monitor.headers = json.dumps(data['headers'])
        except TypeError:
            abort(400, description="Invalid JSON format for 'headers'.")
    if 'body' in data:
        try:
            json.dumps(data['body'])
            monitor.body = json.dumps(data['body'])
        except TypeError:
            abort(400, description="Invalid JSON format for 'body'.")
    if 'interval_seconds' in data:
        monitor.interval_seconds = data['interval_seconds']
    if 'is_active' in data:
        monitor.is_active = data['is_active']

    db.session.commit()
    return jsonify(monitor_schema.dump(monitor)), 200

@api_bp.route('/monitors/<int:monitor_id>', methods=['DELETE'])
@api_login_required
def delete_monitor(monitor_id):
    """Delete a monitor."""
    monitor = db.session.get(Monitor, monitor_id)
    if not monitor or monitor.project.user_id != current_user.id:
        abort(404, description="Monitor not found or not owned by user.")

    db.session.delete(monitor)
    db.session.commit()
    return jsonify({'message': 'Monitor deleted successfully'}), 204

# --- Metrics API ---
@api_bp.route('/monitors/<int:monitor_id>/metrics', methods=['GET'])
@api_login_required
def get_monitor_metrics(monitor_id):
    """Get metrics for a specific monitor.
    Optional query parameters:
        start_time: ISO formatted datetime string
        end_time: ISO formatted datetime string
        limit: integer (default 100)
    """
    monitor = db.session.get(Monitor, monitor_id)
    if not monitor or monitor.project.user_id != current_user.id:
        abort(404, description="Monitor not found or not owned by user.")

    query = monitor.metrics.order_by(desc(Metric.timestamp))

    start_time_str = request.args.get('start_time')
    end_time_str = request.args.get('end_time')
    limit = request.args.get('limit', type=int, default=100)

    try:
        if start_time_str:
            start_time = datetime.fromisoformat(start_time_str).replace(tzinfo=pytz.utc)
            query = query.filter(Metric.timestamp >= start_time)
        if end_time_str:
            end_time = datetime.fromisoformat(end_time_str).replace(tzinfo=pytz.utc)
            query = query.filter(Metric.timestamp <= end_time)
    except ValueError:
        abort(400, description="Invalid datetime format. Use ISO format (e.g., 2023-10-27T10:00:00Z).")

    metrics = query.limit(limit).all()
    return jsonify(metrics_schema.dump(metrics)), 200

# --- Alert Rules API ---
@api_bp.route('/monitors/<int:monitor_id>/alert-rules', methods=['GET'])
@api_login_required
def get_alert_rules_for_monitor(monitor_id):
    """Get all alert rules for a specific monitor."""
    monitor = db.session.get(Monitor, monitor_id)
    if not monitor or monitor.project.user_id != current_user.id:
        abort(404, description="Monitor not found or not owned by user.")
    alert_rules = monitor.alert_rules.all()
    return jsonify(alert_rules_schema.dump(alert_rules)), 200

@api_bp.route('/alert-rules/<int:rule_id>', methods=['GET'])
@api_login_required
def get_alert_rule(rule_id):
    """Get a single alert rule by ID."""
    rule = db.session.get(AlertRule, rule_id)
    if not rule or rule.monitor.project.user_id != current_user.id:
        abort(404, description="Alert rule not found or not owned by user.")
    return jsonify(alert_rule_schema.dump(rule)), 200

@api_bp.route('/monitors/<int:monitor_id>/alert-rules', methods=['POST'])
@api_login_required
def create_alert_rule(monitor_id):
    """Create a new alert rule for a monitor."""
    monitor = db.session.get(Monitor, monitor_id)
    if not monitor or monitor.project.user_id != current_user.id:
        abort(404, description="Monitor not found or not owned by user.")

    data = request.get_json()
    if not data or not all(k in data for k in ['name', 'threshold_type', 'operator', 'threshold_value']):
        abort(400, description="Missing required fields: 'name', 'threshold_type', 'operator', 'threshold_value'.")

    # Validate uniqueness for the current monitor
    if AlertRule.query.filter_by(name=data['name'], monitor_id=monitor_id).first():
        abort(409, description="An alert rule with this name already exists for this monitor.")

    try:
        threshold_value = float(data['threshold_value'])
    except ValueError:
        abort(400, description="'threshold_value' must be a number.")

    rule = AlertRule(
        name=data['name'],
        threshold_type=data['threshold_type'],
        operator=data['operator'],
        threshold_value=threshold_value,
        is_active=data.get('is_active', True),
        monitor=monitor
    )
    db.session.add(rule)
    db.session.commit()
    return jsonify(alert_rule_schema.dump(rule)), 201

@api_bp.route('/alert-rules/<int:rule_id>', methods=['PUT'])
@api_login_required
def update_alert_rule(rule_id):
    """Update an existing alert rule."""
    rule = db.session.get(AlertRule, rule_id)
    if not rule or rule.monitor.project.user_id != current_user.id:
        abort(404, description="Alert rule not found or not owned by user.")

    data = request.get_json()
    if not data:
        abort(400, description="No data provided for update.")

    if 'name' in data:
        existing_rule = AlertRule.query.filter_by(name=data['name'], monitor_id=rule.monitor_id).first()
        if existing_rule and existing_rule.id != rule_id:
            abort(409, description="An alert rule with this name already exists for this monitor.")
        rule.name = data['name']
    if 'threshold_type' in data:
        rule.threshold_type = data['threshold_type']
    if 'operator' in data:
        rule.operator = data['operator']
    if 'threshold_value' in data:
        try:
            rule.threshold_value = float(data['threshold_value'])
        except ValueError:
            abort(400, description="'threshold_value' must be a number.")
    if 'is_active' in data:
        rule.is_active = data['is_active']

    db.session.commit()
    return jsonify(alert_rule_schema.dump(rule)), 200

@api_bp.route('/alert-rules/<int:rule_id>', methods=['DELETE'])
@api_login_required
def delete_alert_rule(rule_id):
    """Delete an alert rule."""
    rule = db.session.get(AlertRule, rule_id)
    if not rule or rule.monitor.project.user_id != current_user.id:
        abort(404, description="Alert rule not found or not owned by user.")

    db.session.delete(rule)
    db.session.commit()
    return jsonify({'message': 'Alert rule deleted successfully'}), 204

# --- Triggered Alerts API ---
@api_bp.route('/monitors/<int:monitor_id>/triggered-alerts', methods=['GET'])
@api_login_required
def get_triggered_alerts_for_monitor(monitor_id):
    """Get triggered alerts for a specific monitor."""
    monitor = db.session.get(Monitor, monitor_id)
    if not monitor or monitor.project.user_id != current_user.id:
        abort(404, description="Monitor not found or not owned by user.")

    alerts = monitor.triggered_alerts.order_by(desc(TriggeredAlert.triggered_at)).all()
    return jsonify(triggered_alerts_schema.dump(alerts)), 200

@api_bp.route('/triggered-alerts/<int:alert_id>', methods=['GET'])
@api_login_required
def get_triggered_alert(alert_id):
    """Get a single triggered alert by ID."""
    alert = db.session.get(TriggeredAlert, alert_id)
    # Check ownership via the rule and monitor
    if not alert or alert.rule.monitor.project.user_id != current_user.id:
        abort(404, description="Triggered alert not found or not owned by user.")
    return jsonify(triggered_alert_schema.dump(alert)), 200

# (Optional: API for users, but usually managed via UI/admin)
@api_bp.route('/users/me', methods=['GET'])
@api_login_required
def get_current_user():
    """Get details of the current authenticated user."""
    return jsonify(user_schema.dump(current_user)), 200
```