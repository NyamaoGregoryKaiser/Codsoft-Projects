```python
from datetime import datetime
from app import db
from sqlalchemy_jsonfield import JSONField

class Visualization(db.Model):
    __tablename__ = 'visualizations'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    type = db.Column(db.String(50), nullable=False) # e.g., 'bar', 'line', 'pie', 'table'
    query_config = db.Column(JSONField().with_variant(db.Text(), 'sqlite'), nullable=False) # SQL query or API parameters
    chart_options = db.Column(JSONField().with_variant(db.Text(), 'sqlite'), nullable=False) # ECharts options or D3 config
    data_source_id = db.Column(db.Integer, db.ForeignKey('data_sources.id'), nullable=False)
    creator_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    is_public = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    dashboards = db.relationship('Dashboard', secondary='dashboard_visualizations', back_populates='visualizations')

    def __repr__(self):
        return f'<Visualization {self.name} ({self.type})>'

    @classmethod
    def get_user_visualizations(cls, user_id):
        return cls.query.filter_by(creator_id=user_id).all()
```