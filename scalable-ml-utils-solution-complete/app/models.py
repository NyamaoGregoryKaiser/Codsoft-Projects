from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import Column, Integer, Float, String

db = SQLAlchemy()

class TrainingData(db.Model):
    id = Column(Integer, primary_key=True)
    feature1 = Column(Float, nullable=False)
    feature2 = Column(Float, nullable=False)
    target = Column(Float, nullable=False)

    def __repr__(self):
        return f"<TrainingData {self.id}>"