import json
from flask_wtf import FlaskForm
from wtforms import StringField, TextAreaField, IntegerField, SelectField, BooleanField, SubmitField
from wtforms.validators import DataRequired, Length, URL, NumberRange, Optional, ValidationError
from app.models import Project, Monitor, AlertRule
from flask_login import current_user
import re

def is_valid_json(form, field):
    if field.data:
        try:
            json.loads(field.data)
        except json.JSONDecodeError:
            raise ValidationError('Invalid JSON format.')

class ProjectForm(FlaskForm):
    name = StringField('Project Name', validators=[DataRequired(), Length(min=1, max=128)])
    description = TextAreaField('Description', validators=[Length(max=500), Optional()])
    submit = SubmitField('Save Project')

    def validate_name(self, name):
        project = Project.query.filter_by(name=name.data, user_id=current_user.id).first()
        if project is not None and project.id != (self.project_id if hasattr(self, 'project_id') else None):
            raise ValidationError('A project with this name already exists for your account.')

class MonitorForm(FlaskForm):
    name = StringField('Monitor Name', validators=[DataRequired(), Length(min=1, max=128)])
    url = StringField('URL', validators=[DataRequired(), URL()])
    method = SelectField('Method', choices=[('GET', 'GET'), ('POST', 'POST'), ('PUT', 'PUT'), ('DELETE', 'DELETE')], default='GET')
    headers = TextAreaField('Headers (JSON)', validators=[Optional(), is_valid_json])
    body = TextAreaField('Body (JSON)', validators=[Optional(), is_valid_json])
    interval_seconds = IntegerField('Check Interval (seconds)', validators=[DataRequired(), NumberRange(min=10, max=3600)], default=60)
    is_active = BooleanField('Active', default=True)
    submit = SubmitField('Save Monitor')

    def validate_name(self, name):
        if not hasattr(self, 'project_id'): # During creation or if project_id is not set
            return
        monitor = Monitor.query.filter_by(name=name.data, project_id=self.project_id).first()
        if monitor is not None and monitor.id != (self.monitor_id if hasattr(self, 'monitor_id') else None):
            raise ValidationError('A monitor with this name already exists in this project.')

class AlertRuleForm(FlaskForm):
    name = StringField('Rule Name', validators=[DataRequired(), Length(min=1, max=128)])
    threshold_type = SelectField('Metric Type', choices=[
        ('response_time_ms', 'Response Time (ms)'),
        ('status_code', 'Status Code')
    ], validators=[DataRequired()])
    operator = SelectField('Operator', choices=[
        ('>', '> (Greater Than)'),
        ('>=', '>= (Greater Than or Equal To)'),
        ('<', '< (Less Than)'),
        ('<=', '<= (Less Than or Equal To)'),
        ('==', '== (Equals)'),
        ('!=', '!= (Not Equals)')
    ], validators=[DataRequired()])
    threshold_value = StringField('Threshold Value', validators=[DataRequired()]) # Use StringField to allow both int and float, then convert
    is_active = BooleanField('Active', default=True)
    submit = SubmitField('Save Alert Rule')

    def validate_threshold_value(self, field):
        try:
            float(field.data)
        except ValueError:
            raise ValidationError('Threshold value must be a number.')

    def validate_name(self, name):
        if not hasattr(self, 'monitor_id'): # During creation or if monitor_id is not set
            return
        rule = AlertRule.query.filter_by(name=name.data, monitor_id=self.monitor_id).first()
        if rule is not None and rule.id != (self.rule_id if hasattr(self, 'rule_id') else None):
            raise ValidationError('An alert rule with this name already exists for this monitor.')

```