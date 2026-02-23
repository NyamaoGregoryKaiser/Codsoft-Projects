```python
from backend.app.extensions import db, ma
from .base import Base
import json

# Many-to-many relationship for Dashboard and Visualization
dashboard_visualizations = db.Table('dashboard_visualizations',
    db.Column('dashboard_id', db.Integer, db.ForeignKey('dashboard.id'), primary_key=True),
    db.Column('visualization_id', db.Integer, db.ForeignKey('visualization.id'), primary_key=True)
)

class Dashboard(Base):
    __tablename__ = 'dashboard'
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    layout = db.Column(db.JSON, nullable=False) # JSON object describing visualization positions/sizes
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    is_public = db.Column(db.Boolean, default=False) # Whether dashboard is publicly viewable

    # Relationships
    visualizations = db.relationship('Visualization', secondary=dashboard_visualizations, lazy='joined',
                                     backref=db.backref('dashboards', lazy=True))

    def __repr__(self):
        return f'<Dashboard {self.name}>'

class DashboardSchema(ma.SQLAlchemyAutoSchema):
    # Nested visualization schema for dashboards
    visualizations = ma.Nested('VisualizationSchema', many=True, exclude=('dashboards',))

    class Meta:
        model = Dashboard
        load_instance = True
        sqla_session = db.session

dashboard_schema = DashboardSchema()
dashboards_schema = DashboardSchema(many=True)

```