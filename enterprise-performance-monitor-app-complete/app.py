```python
import os
from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_restful import Api, Resource, reqparse
from flask_caching import Cache
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from dotenv import load_dotenv

load_dotenv()  # Load environment variables from .env

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['CACHE_TYPE'] = 'simple' # or 'redis' for Redis caching. Configure accordingly in .env
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY')
app.config['PROPAGATE_EXCEPTIONS'] = True #Important for error handling


db = SQLAlchemy(app)
api = Api(app)
cache = Cache(app)
jwt = JWTManager(app)


# --- Models ---
class PerformanceData(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime) #add import datetime
    metric = db.Column(db.String(50))
    value = db.Column(db.Float)
    # Add other relevant fields

# --- API ---
class PerformanceDataAPI(Resource):
    @jwt_required()
    @cache.cached(timeout=60) #Cache for 60 seconds
    def get(self, metric_id):
        data = PerformanceData.query.get(metric_id)
        if data:
            return {'id': data.id, 'metric': data.metric, 'value': data.value}, 200
        return {'message': 'Data not found'}, 404

    @jwt_required()
    def post(self):
        parser = reqparse.RequestParser()
        parser.add_argument('metric', required=True)
        parser.add_argument('value', type=float, required=True)
        args = parser.parse_args()
        new_data = PerformanceData(metric=args['metric'], value=args['value']) #Add timestamp
        db.session.add(new_data)
        db.session.commit()
        return {'message': 'Data added'}, 201

# --- Authentication ---
class LoginAPI(Resource):
    def post(self):
        parser = reqparse.RequestParser()
        parser.add_argument('username', required=True)
        parser.add_argument('password', required=True)
        args = parser.parse_args()
        #Replace with actual user authentication logic
        if args['username'] == 'admin' and args['password'] == 'admin':
            access_token = create_access_token(identity=args['username'])
            return {'access_token': access_token}
        return {'message': 'Invalid credentials'}, 401


api.add_resource(PerformanceDataAPI, '/data/<int:metric_id>')
api.add_resource(LoginAPI, '/login')


if __name__ == '__main__':
    db.create_all() # Create the database tables
    app.run(debug=True) # Set debug=False for production

```