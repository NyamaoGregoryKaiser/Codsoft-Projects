from app.extensions import ma
from app.models import User, Project, Monitor, Metric, AlertRule, TriggeredAlert

# --- User Schemas ---
class UserSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = User
        load_instance = True
        exclude = ('password_hash',) # Never expose password hash

# --- Project Schemas ---
class ProjectSchema(ma.SQLAlchemyAutoSchema):
    user_id = ma.Integer(required=True) # Expose user_id in API
    class Meta:
        model = Project
        load_instance = True
        include_relationships = False # Avoid eager loading all relationships by default

class ProjectWithMonitorsSchema(ProjectSchema):
    monitors = ma.List(ma.Nested('MonitorSchema', exclude=('project_id', 'project'))) # Nested, but avoid circular reference
    class Meta(ProjectSchema.Meta):
        pass # Inherit from ProjectSchema meta

# --- Monitor Schemas ---
class MonitorSchema(ma.SQLAlchemyAutoSchema):
    project_id = ma.Integer(required=True)
    class Meta:
        model = Monitor
        load_instance = True
        include_relationships = False
        # Custom serialization for JSON fields
        dump_only = ('headers', 'body') # Read-only for simplicity, or handle complex parsing for load
        # To handle complex load, you'd define methods for headers/body or a custom field.

class MonitorWithDetailsSchema(MonitorSchema):
    metrics = ma.List(ma.Nested('MetricSchema', exclude=('monitor_id', 'monitor')), dump_only=True)
    alert_rules = ma.List(ma.Nested('AlertRuleSchema', exclude=('monitor_id', 'monitor')), dump_only=True)
    class Meta(MonitorSchema.Meta):
        pass

# --- Metric Schemas ---
class MetricSchema(ma.SQLAlchemyAutoSchema):
    monitor_id = ma.Integer(required=True)
    class Meta:
        model = Metric
        load_instance = True
        include_fk = True # Include foreign key in output
        # For filtering/querying, you might want to specify which fields are sortable/filterable

# --- Alert Rule Schemas ---
class AlertRuleSchema(ma.SQLAlchemyAutoSchema):
    monitor_id = ma.Integer(required=True)
    class Meta:
        model = AlertRule
        load_instance = True
        include_fk = True

class AlertRuleWithTriggeredSchema(AlertRuleSchema):
    triggered_alerts = ma.List(ma.Nested('TriggeredAlertSchema', exclude=('rule_id', 'rule', 'monitor_id')), dump_only=True)
    class Meta(AlertRuleSchema.Meta):
        pass

# --- Triggered Alert Schemas ---
class TriggeredAlertSchema(ma.SQLAlchemyAutoSchema):
    rule_id = ma.Integer(required=True)
    monitor_id = ma.Integer(required=True)
    class Meta:
        model = TriggeredAlert
        load_instance = True
        include_fk = True

# Initialize schemas
user_schema = UserSchema()
users_schema = UserSchema(many=True)

project_schema = ProjectSchema()
projects_schema = ProjectSchema(many=True)
project_with_monitors_schema = ProjectWithMonitorsSchema()
projects_with_monitors_schema = ProjectWithMonitorsSchema(many=True)

monitor_schema = MonitorSchema()
monitors_schema = MonitorSchema(many=True)
monitor_with_details_schema = MonitorWithDetailsSchema()

metric_schema = MetricSchema()
metrics_schema = MetricSchema(many=True)

alert_rule_schema = AlertRuleSchema()
alert_rules_schema = AlertRuleSchema(many=True)
alert_rule_with_triggered_schema = AlertRuleWithTriggeredSchema()

triggered_alert_schema = TriggeredAlertSchema()
triggered_alerts_schema = TriggeredAlertSchema(many=True)
```