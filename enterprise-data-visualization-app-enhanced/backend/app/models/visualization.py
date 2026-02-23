```python
from backend.app.extensions import db, ma
from .base import Base
import json

class Visualization(Base):
    __tablename__ = 'visualization'
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    chart_type = db.Column(db.String(50), nullable=False) # e.g., 'bar', 'line', 'pie'
    query_config = db.Column(db.JSON, nullable=False) # JSON object for data query (e.g., SQL, filters)
    chart_config = db.Column(db.JSON, nullable=False) # JSON object for chart display options
    data_source_id = db.Column(db.Integer, db.ForeignKey('data_source.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    def __repr__(self):
        return f'<Visualization {self.name} ({self.chart_type})>'

class VisualizationSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Visualization
        load_instance = True
        sqla_session = db.session

visualization_schema = VisualizationSchema()
visualizations_schema = VisualizationSchema(many=True)

```