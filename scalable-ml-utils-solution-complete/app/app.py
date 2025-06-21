from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from sklearn.linear_model import LinearRegression
import pandas as pd
from models import db, TrainingData

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://user:password@db:5432/mydatabase' # Replace with your DB connection string
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

@app.route('/data', methods=['POST'])
def add_data():
    data = request.get_json()
    new_data = TrainingData(feature1=data['feature1'], feature2=data['feature2'], target=data['target'])
    db.session.add(new_data)
    db.session.commit()
    return jsonify({'message': 'Data added successfully'}), 201

@app.route('/data', methods=['GET'])
def get_data():
    data = TrainingData.query.all()
    data_list = [{'id': item.id, 'feature1': item.feature1, 'feature2': item.feature2, 'target': item.target} for item in data]
    return jsonify(data_list)


@app.route('/train', methods=['POST'])
def train_model():
    data = TrainingData.query.all()
    if not data:
        return jsonify({'error': 'No training data available'}), 400
    df = pd.DataFrame([(item.feature1, item.feature2, item.target) for item in data], columns=['feature1', 'feature2', 'target'])
    X = df[['feature1', 'feature2']]
    y = df['target']
    model = LinearRegression()
    model.fit(X, y)
    #Persist model -  (In a real app, you'd save this model to a file or database)
    return jsonify({'message': 'Model trained successfully'}), 200


if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, host='0.0.0.0')