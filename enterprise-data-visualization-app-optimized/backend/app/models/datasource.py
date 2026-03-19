```python
from datetime import datetime
from app import db
from sqlalchemy_jsonfield import JSONField

class DataSource(db.Model):
    __tablename__ = 'data_sources'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    type = db.Column(db.String(50), nullable=False) # e.g., 'postgresql', 'mysql', 'csv', 'api'
    connection_params = db.Column(JSONField().with_variant(
        db.Text(), 'sqlite' # Handle different DB types if needed
    ), nullable=False) # Stores sensitive connection details encrypted or as environment variables
    owner_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    visualizations = db.relationship('Visualization', backref='data_source', lazy=True)

    def __repr__(self):
        return f'<DataSource {self.name} ({self.type})>'

    @classmethod
    def get_user_datasources(cls, user_id):
        return cls.query.filter_by(owner_id=user_id).all()

    # Consider adding encryption/decryption methods for connection_params
    # def encrypt_params(self, params): ...
    # def decrypt_params(self): ...
```