```python
from datetime import datetime
from app import db
from sqlalchemy_jsonfield import JSONField

class Dashboard(db.Model):
    __tablename__ = 'dashboards'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    layout = db.Column(JSONField().with_variant(db.Text(), 'sqlite'), nullable=False, default=lambda: {}) # Grid layout for visualizations
    creator_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    is_public = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    visualizations = db.relationship('Visualization', secondary='dashboard_visualizations', back_populates='dashboards')

    def __repr__(self):
        return f'<Dashboard {self.name}>'

# Association table for Dashboard and Visualization (Many-to-Many)
dashboard_visualizations = db.Table(
    'dashboard_visualizations',
    db.Column('dashboard_id', db.Integer, db.ForeignKey('dashboards.id'), primary_key=True),
    db.Column('visualization_id', db.Integer, db.ForeignKey('visualizations.id'), primary_key=True),
    db.Column('position_x', db.Integer, default=0), # x position on dashboard grid
    db.Column('position_y', db.Integer, default=0), # y position on dashboard grid
    db.Column('width', db.Integer, default=6),      # width on dashboard grid
    db.Column('height', db.Integer, default=4)     # height on dashboard grid
)
```