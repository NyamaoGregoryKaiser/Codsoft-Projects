from flask import Blueprint, render_template, redirect, url_for, flash, request, jsonify, abort
from flask_login import login_required, current_user
from sqlalchemy import desc, func
import json
from datetime import datetime, timedelta
import pytz

from app.extensions import db, cache, limiter
from app.models import Project, Monitor, Metric, AlertRule, TriggeredAlert
from app.core.forms import ProjectForm, MonitorForm, AlertRuleForm
from app.core.services import MonitorService

core_bp = Blueprint('core', __name__, template_folder='templates')

@core_bp.route('/')
@core_bp.route('/dashboard')
@login_required
@cache.cached(timeout=60, query_string=True, unless=lambda: current_user.is_anonymous) # Cache for logged-in users
def dashboard():
    projects = current_user.projects.order_by(Project.created_at.desc()).all()

    # Fetch recent metrics for display on dashboard (e.g., last 24 hours)
    time_24_hours_ago = datetime.now(pytz.utc) - timedelta(hours=24)
    recent_metrics = db.session.query(
        Monitor.name,
        func.avg(Metric.response_time_ms).label('avg_response_time'),
        func.min(Metric.response_time_ms).label('min_response_time'),
        func.max(Metric.response_time_ms).label('max_response_time'),
        func.count(Metric.id).label('total_checks'),
        func.sum(db.case((Metric.status_code != 200, 1), else_=0)).label('error_count'),
        func.max(Monitor.last_checked).label('last_checked')
    ).join(Metric, Monitor.id == Metric.monitor_id) \
     .filter(Monitor.user_id == current_user.id, Metric.timestamp >= time_24_hours_ago) \
     .group_by(Monitor.name) \
     .order_by(Monitor.name).all()

    # Fetch recent triggered alerts
    recent_alerts = TriggeredAlert.query.join(AlertRule).join(Monitor) \
                                 .filter(Monitor.user_id == current_user.id,
                                         TriggeredAlert.triggered_at >= time_24_hours_ago) \
                                 .order_by(TriggeredAlert.triggered_at.desc()) \
                                 .limit(10).all()

    # Calculate overall status
    total_monitors = current_user.projects.join(Monitor).filter(Monitor.is_active==True).count()
    failing_monitors = Monitor.query.join(Metric) \
                                .filter(Monitor.user_id == current_user.id,
                                       Metric.timestamp >= time_24_hours_ago,
                                       Metric.status_code != 200) \
                                .group_by(Monitor.id).having(func.count(Metric.id) > 0).count()

    overall_status = "Good"
    if failing_monitors > 0:
        overall_status = "Warning"
    if TriggeredAlert.query.join(AlertRule).join(Monitor) \
                            .filter(Monitor.user_id == current_user.id,
                                    TriggeredAlert.status == 'triggered').count() > 0:
        overall_status = "Critical"

    return render_template('core/dashboard.html',
                           projects=projects,
                           recent_metrics=recent_metrics,
                           recent_alerts=recent_alerts,
                           overall_status=overall_status,
                           total_monitors=total_monitors,
                           failing_monitors=failing_monitors)

# --- Project Management ---
@core_bp.route('/projects', methods=['GET'])
@login_required
def projects_list():
    page = request.args.get('page', 1, type=int)
    projects_pagination = current_user.projects.order_by(Project.created_at.desc()).paginate(
        page=page, per_page=current_app.config['ITEMS_PER_PAGE'], error_out=False)
    projects = projects_pagination.items
    return render_template('core/projects/list.html', projects=projects, pagination=projects_pagination)

@core_bp.route('/projects/create', methods=['GET', 'POST'])
@login_required
def project_create():
    form = ProjectForm()
    if form.validate_on_submit():
        project = Project(name=form.name.data, description=form.description.data, user=current_user)
        db.session.add(project)
        db.session.commit()
        flash('Project created successfully!', 'success')
        return redirect(url_for('core.projects_list'))
    return render_template('core/projects/form.html', form=form, title='Create Project')

@core_bp.route('/projects/<int:project_id>/edit', methods=['GET', 'POST'])
@login_required
def project_edit(project_id):
    project = db.session.get(Project, project_id)
    if project is None or project.user != current_user:
        abort(404)
    form = ProjectForm(obj=project)
    form.project_id = project_id # Pass project ID to form for unique name validation

    if form.validate_on_submit():
        project.name = form.name.data
        project.description = form.description.data
        db.session.commit()
        flash('Project updated successfully!', 'success')
        return redirect(url_for('core.projects_list'))
    return render_template('core/projects/form.html', form=form, title='Edit Project', project=project)

@core_bp.route('/projects/<int:project_id>/delete', methods=['POST'])
@login_required
def project_delete(project_id):
    project = db.session.get(Project, project_id)
    if project is None or project.user != current_user:
        abort(404)
    db.session.delete(project)
    db.session.commit()
    flash('Project deleted successfully!', 'info')
    return redirect(url_for('core.projects_list'))

# --- Monitor Management ---
@core_bp.route('/projects/<int:project_id>')
@login_required
def project_detail(project_id):
    project = db.session.get(Project, project_id)
    if project is None or project.user != current_user:
        abort(404)
    monitors = project.monitors.order_by(Monitor.created_at.desc()).all()
    return render_template('core/monitors/list.html', project=project, monitors=monitors)

@core_bp.route('/projects/<int:project_id>/monitors/create', methods=['GET', 'POST'])
@login_required
def monitor_create(project_id):
    project = db.session.get(Project, project_id)
    if project is None or project.user != current_user:
        abort(404)

    form = MonitorForm()
    form.project_id = project_id # Pass project_id for form validation
    if form.validate_on_submit():
        headers_json = json.dumps(json.loads(form.headers.data)) if form.headers.data else '{}'
        body_json = json.dumps(json.loads(form.body.data)) if form.body.data else '{}'
        monitor = Monitor(
            name=form.name.data,
            url=form.url.data,
            method=form.method.data,
            headers=headers_json,
            body=body_json,
            interval_seconds=form.interval_seconds.data,
            is_active=form.is_active.data,
            project=project
        )
        db.session.add(monitor)
        db.session.commit()
        flash('Monitor created successfully!', 'success')
        return redirect(url_for('core.project_detail', project_id=project.id))
    return render_template('core/monitors/form.html', form=form, title='Create Monitor', project=project)

@core_bp.route('/monitors/<int:monitor_id>/edit', methods=['GET', 'POST'])
@login_required
def monitor_edit(monitor_id):
    monitor = db.session.get(Monitor, monitor_id)
    if monitor is None or monitor.project.user != current_user:
        abort(404)

    # Pre-fill form with JSON-formatted strings
    monitor.headers = json.dumps(json.loads(monitor.headers), indent=2) if monitor.headers else ''
    monitor.body = json.dumps(json.loads(monitor.body), indent=2) if monitor.body else ''

    form = MonitorForm(obj=monitor)
    form.project_id = monitor.project_id
    form.monitor_id = monitor_id

    if form.validate_on_submit():
        monitor.name = form.name.data
        monitor.url = form.url.data
        monitor.method = form.method.data
        monitor.headers = json.dumps(json.loads(form.headers.data)) if form.headers.data else '{}'
        monitor.body = json.dumps(json.loads(form.body.data)) if form.body.data else '{}'
        monitor.interval_seconds = form.interval_seconds.data
        monitor.is_active = form.is_active.data
        db.session.commit()
        flash('Monitor updated successfully!', 'success')
        return redirect(url_for('core.project_detail', project_id=monitor.project.id))
    return render_template('core/monitors/form.html', form=form, title='Edit Monitor', project=monitor.project, monitor=monitor)

@core_bp.route('/monitors/<int:monitor_id>/delete', methods=['POST'])
@login_required
def monitor_delete(monitor_id):
    monitor = db.session.get(Monitor, monitor_id)
    if monitor is None or monitor.project.user != current_user:
        abort(404)
    project_id = monitor.project.id
    db.session.delete(monitor)
    db.session.commit()
    flash('Monitor deleted successfully!', 'info')
    return redirect(url_for('core.project_detail', project_id=project_id))

# --- Metrics & Alerts Views ---
@core_bp.route('/monitors/<int:monitor_id>/metrics')
@login_required
def monitor_metrics(monitor_id):
    monitor = db.session.get(Monitor, monitor_id)
    if monitor is None or monitor.project.user != current_user:
        abort(404)

    # Fetch last 100 metrics for display
    metrics = monitor.metrics.order_by(desc(Metric.timestamp)).limit(100).all()

    # Prepare data for chart (last 24 hours)
    time_24_hours_ago = datetime.now(pytz.utc) - timedelta(hours=24)
    chart_metrics = monitor.metrics.filter(Metric.timestamp >= time_24_hours_ago).order_by(Metric.timestamp).all()
    
    # Simple aggregation for chart (e.g., average response time per hour)
    chart_data = []
    # This is a simple client-side data preparation. For production, consider server-side aggregation.
    for metric in chart_metrics:
        chart_data.append({
            'timestamp': metric.timestamp.isoformat(),
            'response_time_ms': metric.response_time_ms,
            'status_code': metric.status_code
        })

    return render_template('core/monitors/metrics.html', monitor=monitor, metrics=metrics, chart_data=json.dumps(chart_data))

@core_bp.route('/monitors/<int:monitor_id>/alerts')
@login_required
def monitor_alerts(monitor_id):
    monitor = db.session.get(Monitor, monitor_id)
    if monitor is None or monitor.project.user != current_user:
        abort(404)

    alert_rules = monitor.alert_rules.order_by(AlertRule.created_at.desc()).all()
    triggered_alerts = monitor.triggered_alerts.order_by(TriggeredAlert.triggered_at.desc()).limit(50).all() # Show recent 50

    return render_template('core/monitors/alerts.html', monitor=monitor, alert_rules=alert_rules, triggered_alerts=triggered_alerts)

@core_bp.route('/monitors/<int:monitor_id>/alerts/create', methods=['GET', 'POST'])
@login_required
def alert_rule_create(monitor_id):
    monitor = db.session.get(Monitor, monitor_id)
    if monitor is None or monitor.project.user != current_user:
        abort(404)

    form = AlertRuleForm()
    form.monitor_id = monitor_id # Pass monitor_id for form validation
    if form.validate_on_submit():
        rule = AlertRule(
            name=form.name.data,
            threshold_type=form.threshold_type.data,
            operator=form.operator.data,
            threshold_value=float(form.threshold_value.data),
            is_active=form.is_active.data,
            monitor=monitor
        )
        db.session.add(rule)
        db.session.commit()
        flash('Alert rule created successfully!', 'success')
        return redirect(url_for('core.monitor_alerts', monitor_id=monitor.id))
    return render_template('core/alerts/form.html', form=form, title='Create Alert Rule', monitor=monitor)

@core_bp.route('/alerts/<int:rule_id>/edit', methods=['GET', 'POST'])
@login_required
def alert_rule_edit(rule_id):
    rule = db.session.get(AlertRule, rule_id)
    if rule is None or rule.monitor.project.user != current_user:
        abort(404)

    form = AlertRuleForm(obj=rule)
    form.monitor_id = rule.monitor_id
    form.rule_id = rule_id
    if form.validate_on_submit():
        rule.name = form.name.data
        rule.threshold_type = form.threshold_type.data
        rule.operator = form.operator.data
        rule.threshold_value = float(form.threshold_value.data)
        rule.is_active = form.is_active.data
        db.session.commit()
        flash('Alert rule updated successfully!', 'success')
        return redirect(url_for('core.monitor_alerts', monitor_id=rule.monitor.id))
    return render_template('core/alerts/form.html', form=form, title='Edit Alert Rule', monitor=rule.monitor, rule=rule)

@core_bp.route('/alerts/<int:rule_id>/delete', methods=['POST'])
@login_required
def alert_rule_delete(rule_id):
    rule = db.session.get(AlertRule, rule_id)
    if rule is None or rule.monitor.project.user != current_user:
        abort(404)
    monitor_id = rule.monitor.id
    db.session.delete(rule)
    db.session.commit()
    flash('Alert rule deleted successfully!', 'info')
    return redirect(url_for('core.monitor_alerts', monitor_id=monitor_id))

# --- Trigger monitor check manually (for testing/immediate feedback) ---
@core_bp.route('/monitors/<int:monitor_id>/check', methods=['POST'])
@login_required
def monitor_check_manual(monitor_id):
    monitor = db.session.get(Monitor, monitor_id)
    if monitor is None or monitor.project.user != current_user:
        abort(404)

    # Run the check in the foreground. In a true production system,
    # this might queue a task for the background worker to avoid blocking.
    try:
        new_metric = MonitorService.run_monitor_check(monitor)
        db.session.add(monitor) # To update last_checked
        db.session.commit()
        flash(f'Manual check for {monitor.name} completed: Status {new_metric.status_code}, Time {new_metric.response_time_ms:.2f}ms', 'success')
    except Exception as e:
        db.session.rollback()
        flash(f'Error during manual check for {monitor.name}: {e}', 'danger')
        current_app.logger.error(f"Manual check failed for monitor {monitor_id}: {e}", exc_info=True)

    return redirect(url_for('core.monitor_metrics', monitor_id=monitor.id))


from flask import current_app # Import inside function to avoid circular dependency
```