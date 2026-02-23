```python
from backend.app.extensions import db, ma
from .base import Base
import json

class DataSource(Base):
    __tablename__ = 'data_source'
    name = db.Column(db.String(100), nullable=False)
    type = db.Column(db.String(50), nullable=False) # e.g., 'postgresql', 'csv', 'mysql'
    connection_string = db.Column(db.Text, nullable=False) # Encrypted in real-world scenario
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    # Relationships
    visualizations = db.relationship('Visualization', backref='data_source', lazy=True)

    def __repr__(self):
        return f'<DataSource {self.name} ({self.type})>'

class DataSourceSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = DataSource
        load_instance = True
        sqla_session = db.session
        # Exclude connection_string from serialization for security if not needed by frontend
        # fields = ('id', 'name', 'type', 'user_id', 'created_at', 'updated_at')

data_source_schema = DataSourceSchema()
data_sources_schema = DataSourceSchema(many=True)

```