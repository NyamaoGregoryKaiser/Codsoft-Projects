from datetime import datetime, timedelta
import pytz
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin
from sqlalchemy import Index

from app.extensions import db

class User(UserMixin, db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), index=True, unique=True, nullable=False)
    email = db.Column(db.String(120), index=True, unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(pytz.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(pytz.utc), onupdate=lambda: datetime.now(pytz.utc))
    is_admin = db.Column(db.Boolean, default=False)

    projects = db.relationship('Project', back_populates='user', lazy='dynamic', cascade='all, delete-orphan')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def __repr__(self):
        return f'<User {self.username}>'

class Project(db.Model):
    __tablename__ = 'projects'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(128), index=True, nullable=False)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(pytz.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(pytz.utc), onupdate=lambda: datetime.now(pytz.utc))

    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    user = db.relationship('User', back_populates='projects')

    monitors = db.relationship('Monitor', back_populates='project', lazy='dynamic', cascade='all, delete-orphan')

    __table_args__ = (
        db.UniqueConstraint('name', 'user_id', name='_user_project_uc'),
        Index('idx_project_name', 'name'),
    )

    def __repr__(self):
        return f'<Project {self.name}>'

class Monitor(db.Model):
    __tablename__ = 'monitors'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(128), nullable=False)
    url = db.Column(db.String(2048), nullable=False)
    method = db.Column(db.String(10), default='GET', nullable=False) # GET, POST, PUT, DELETE, etc.
    headers = db.Column(db.Text, default='{}') # JSON string of headers
    body = db.Column(db.Text, default='{}') # JSON string of request body
    interval_seconds = db.Column(db.Integer, default=60, nullable=False) # How often to check
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    last_checked = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(pytz.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(pytz.utc), onupdate=lambda: datetime.now(pytz.utc))

    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    project = db.relationship('Project', back_populates='monitors')

    metrics = db.relationship('Metric', back_populates='monitor', lazy='dynamic', cascade='all, delete-orphan')
    alert_rules = db.relationship('AlertRule', back_populates='monitor', lazy='dynamic', cascade='all, delete-orphan')

    __table_args__ = (
        db.UniqueConstraint('name', 'project_id', name='_project_monitor_uc'),
        Index('idx_monitor_url', 'url'),
        Index('idx_monitor_project_active', 'project_id', 'is_active'),
    )

    def __repr__(self):
        return f'<Monitor {self.name} - {self.url}>'

class Metric(db.Model):
    __tablename__ = 'metrics'
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, index=True, nullable=False, default=lambda: datetime.now(pytz.utc))
    response_time_ms = db.Column(db.Float, nullable=False)
    status_code = db.Column(db.Integer, nullable=False)
    response_size_bytes = db.Column(db.Integer)
    error_message = db.Column(db.Text) # Store error messages if a check fails

    monitor_id = db.Column(db.Integer, db.ForeignKey('monitors.id'), nullable=False)
    monitor = db.relationship('Monitor', back_populates='metrics')

    __table_args__ = (
        Index('idx_metric_monitor_timestamp', 'monitor_id', 'timestamp'),
    )

    def __repr__(self):
        return f'<Metric {self.monitor_id} at {self.timestamp} - {self.response_time_ms}ms, {self.status_code}>'

class AlertRule(db.Model):
    __tablename__ = 'alert_rules'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(128), nullable=False)
    threshold_value = db.Column(db.Float, nullable=False) # e.g., 500 (ms) or 400 (status code)
    threshold_type = db.Column(db.String(50), nullable=False) # e.g., 'response_time_ms', 'status_code'
    operator = db.Column(db.String(10), nullable=False) # e.g., '>', '>=', '!=', '=='
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(pytz.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(pytz.utc), onupdate=lambda: datetime.now(pytz.utc))

    monitor_id = db.Column(db.Integer, db.ForeignKey('monitors.id'), nullable=False)
    monitor = db.relationship('Monitor', back_populates='alert_rules')

    triggered_alerts = db.relationship('TriggeredAlert', back_populates='rule', lazy='dynamic', cascade='all, delete-orphan')

    __table_args__ = (
        db.UniqueConstraint('name', 'monitor_id', name='_monitor_alert_rule_uc'),
    )

    def __repr__(self):
        return f'<AlertRule {self.name} for Monitor {self.monitor_id}>'

class TriggeredAlert(db.Model):
    __tablename__ = 'triggered_alerts'
    id = db.Column(db.Integer, primary_key=True)
    triggered_at = db.Column(db.DateTime, default=lambda: datetime.now(pytz.utc), nullable=False)
    status = db.Column(db.String(50), default='triggered', nullable=False) # e.g., 'triggered', 'resolved'
    message = db.Column(db.Text, nullable=False)
    metric_value = db.Column(db.Float) # The value of the metric that caused the alert

    rule_id = db.Column(db.Integer, db.ForeignKey('alert_rules.id'), nullable=False)
    rule = db.relationship('AlertRule', back_populates='triggered_alerts')

    monitor_id = db.Column(db.Integer, db.ForeignKey('monitors.id'), nullable=False) # Denormalize for easier queries
    # No direct relationship to Monitor, use rule.monitor instead

    def __repr__(self):
        return f'<TriggeredAlert {self.id} for Rule {self.rule_id} at {self.triggered_at}>'

```