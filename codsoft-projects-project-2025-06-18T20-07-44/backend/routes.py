from flask import request, jsonify
from flask_restful import Resource
from .models import PerformanceData
from . import db


class PerformanceDataAPI(Resource):
    def get(self):
        data = PerformanceData.query.all()
        return jsonify([{'id': item.id, 'timestamp': item.timestamp, 'metric': item.metric, 'value': item.value} for item in data])

    def post(self):
        data = request.get_json()
        new_data = PerformanceData(**data)
        db.session.add(new_data)
        db.session.commit()
        return jsonify({'message': 'Data added successfully'}), 201



# ... (Add other API endpoints for CRUD operations)

# Register routes
from . import api
api.add_resource(PerformanceDataAPI, '/performance_data')