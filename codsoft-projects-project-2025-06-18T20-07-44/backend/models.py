from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class PerformanceData(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime)
    metric = db.Column(db.String)
    value = db.Column(db.Float)
    # ... other fields