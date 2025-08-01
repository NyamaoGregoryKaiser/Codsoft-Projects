import os
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import create_engine
from sklearn.linear_model import LinearRegression
import pandas as pd
import json
from marshmallow import Schema, fields

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'postgresql://user:password@db:5432/mydatabase')  # Replace with your DB connection string
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Model
class DataPoint(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    feature1 = db.Column(db.Float, nullable=False)
    feature2 = db.Column(db.Float, nullable=False)
    target = db.Column(db.Float, nullable=False)

    def __repr__(self):
        return f'<DataPoint {self.id}>'

# Schema for serialization
class DataPointSchema(Schema):
    id = fields.Integer(dump_only=True)
    feature1 = fields.Float(required=True)
    feature2 = fields.Float(required=True)
    target = fields.Float(required=True)


# API Endpoints
@app.route('/datapoints', methods=['POST'])
def add_datapoint():
    data = request.get_json()
    schema = DataPointSchema()
    errors = schema.validate(data)
    if errors:
        return jsonify(errors), 400
    new_datapoint = DataPoint(**data)
    db.session.add(new_datapoint)
    db.session.commit()
    return jsonify({'message': 'Datapoint added'}), 201

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    try:
        df = pd.DataFrame([data])
        X = df[['feature1', 'feature2']]

        # Load the model (This would be replaced by loading a persisted model)
        model = LinearRegression()  #Replace with a loaded model
        model.fit([[1,2],[3,4],[5,6]],[7,8,9]) #Example Fit

        prediction = model.predict(X)[0]
        return jsonify({'prediction': prediction})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    db.create_all()
    app.run(debug=True, host='0.0.0.0')