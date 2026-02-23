```python
from datetime import datetime
from backend.app.extensions import db

class Base(db.Model):
    """Base model class with common fields."""
    __abstract__ = True

    id = db.Column(db.Integer, primary_key=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def save(self):
        """Commits the current object to the database."""
        db.session.add(self)
        db.session.commit()

    def delete(self):
        """Deletes the current object from the database."""
        db.session.delete(self)
        db.session.commit()

    def update(self, **kwargs):
        """Updates the object with key-value pairs."""
        for key, value in kwargs.items():
            setattr(self, key, value)
        self.save()

class TimestampMixin:
    """Mixin for created_at and updated_at fields."""
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

```