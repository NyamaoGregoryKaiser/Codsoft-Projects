```python
from flask import request, current_app
from flask_restx import Resource, Namespace, abort
from flask_jwt_extended import jwt_required, current_user
from app import db, limiter
from app.models.datasource import DataSource
from app.api.schemas.datasource import datasource_request_model, datasource_response_model, datasource_list_model, \
    datasource_test_model, datasource_fetch_data_request, datasource_fetch_data_response, message_model
from app.utils.decorators import jwt_and_user_loader
from app.services.data_connector import DataConnector
import logging

ns = Namespace('datasources', description='Data source management operations')

@ns.route('/')
class DataSourceList(Resource):
    @jwt_required()
    @jwt_and_user_loader
    @ns.doc(security='jwt')
    @ns.marshal_list_with(datasource_response_model)
    @ns.response(200, 'Success', datasource_list_model)
    @limiter.limit("100 per hour")
    def get(self):
        """Get a list of all data sources owned by the current user."""
        current_app.logger.info(f"User {current_user.id} fetching data source list.")
        data_sources = DataSource.get_user_datasources(current_user.id)
        return data_sources, 200

    @jwt_required()
    @jwt_and_user_loader
    @ns.doc(security='jwt')
    @ns.expect(datasource_request_model, validate=True)
    @ns.marshal_with(datasource_response_model, code=201)
    @ns.response(400, 'Invalid input')
    @limiter.limit("10 per hour")
    def post(self):
        """Create a new data source."""
        current_app.logger.info(f"User {current_user.id} creating a new data source.")
        data = request.json
        new_ds = DataSource(
            name=data['name'],
            type=data['type'],
            connection_params=data['connection_params'], # In a real app, encrypt this!
            owner_id=current_user.id
        )
        db.session.add(new_ds)
        db.session.commit()
        return new_ds, 201

@ns.route('/<int:ds_id>')
@ns.param('ds_id', 'The data source identifier')
class DataSourceResource(Resource):
    @jwt_required()
    @jwt_and_user_loader
    @ns.doc(security='jwt')
    @ns.marshal_with(datasource_response_model)
    @ns.response(200, 'Success')
    @ns.response(404, 'Data source not found')
    @ns.response(403, 'Forbidden')
    @limiter.limit("60 per hour")
    def get(self, ds_id):
        """Retrieve a specific data source."""
        current_app.logger.info(f"User {current_user.id} fetching data source {ds_id}.")
        ds = DataSource.query.get_or_404(ds_id)
        if not (ds.owner_id == current_user.id or current_user.is_admin):
            current_app.logger.warning(f"User {current_user.id} attempted unauthorized access to data source {ds.id}.")
            abort(403, message="Forbidden: You do not have access to this data source.")
        return ds, 200

    @jwt_required()
    @jwt_and_user_loader
    @ns.doc(security='jwt')
    @ns.expect(datasource_request_model, validate=True)
    @ns.marshal_with(datasource_response_model)
    @ns.response(200, 'Data source updated successfully')
    @ns.response(404, 'Data source not found')
    @ns.response(403, 'Forbidden')
    @limiter.limit("30 per hour")
    def put(self, ds_id):
        """Update an existing data source."""
        current_app.logger.info(f"User {current_user.id} updating data source {ds_id}.")
        ds = DataSource.query.get_or_404(ds_id)
        if not (ds.owner_id == current_user.id or current_user.is_admin):
            current_app.logger.warning(f"User {current_user.id} attempted unauthorized update of data source {ds.id}.")
            abort(403, message="Forbidden: You can only update data sources you own.")

        data = request.json
        ds.name = data['name']
        ds.type = data['type']
        ds.connection_params = data['connection_params'] # Again, encryption
        ds.updated_at = db.func.now()
        db.session.commit()
        return ds, 200

    @jwt_required()
    @jwt_and_user_loader
    @ns.doc(security='jwt')
    @ns.response(204, 'Data source deleted successfully', model=message_model)
    @ns.response(404, 'Data source not found')
    @ns.response(403, 'Forbidden')
    @limiter.limit("5 per hour")
    def delete(self, ds_id):
        """Delete a data source."""
        current_app.logger.info(f"User {current_user.id} deleting data source {ds_id}.")
        ds = DataSource.query.get_or_404(ds_id)
        if not (ds.owner_id == current_user.id or current_user.is_admin):
            current_app.logger.warning(f"User {current_user.id} attempted unauthorized deletion of data source {ds.id}.")
            abort(403, message="Forbidden: You can only delete data sources you own.")
        db.session.delete(ds)
        db.session.commit()
        return {'message': 'Data source deleted successfully'}, 204

@ns.route('/<int:ds_id>/test')
class DataSourceTestConnection(Resource):
    @jwt_required()
    @jwt_and_user_loader
    @ns.doc(security='jwt')
    @ns.marshal_with(datasource_test_model)
    @ns.response(200, 'Connection successful')
    @ns.response(400, 'Connection failed')
    @ns.response(404, 'Data source not found')
    @ns.response(403, 'Forbidden')
    @limiter.limit("10 per minute")
    def post(self, ds_id):
        """Test connection to a data source."""
        current_app.logger.info(f"User {current_user.id} testing connection for data source {ds_id}.")
        ds = DataSource.query.get_or_404(ds_id)
        if not (ds.owner_id == current_user.id or current_user.is_admin):
            current_app.logger.warning(f"User {current_user.id} attempted unauthorized test of data source {ds.id}.")
            abort(403, message="Forbidden: You do not have access to this data source.")

        try:
            connector = DataConnector(ds.type, ds.connection_params)
            connector.test_connection()
            current_app.logger.info(f"Connection test successful for data source {ds.id}.")
            return {'status': 'success', 'message': 'Connection successful'}, 200
        except Exception as e:
            current_app.logger.error(f"Connection test failed for data source {ds.id}: {str(e)}", exc_info=True)
            return {'status': 'failed', 'message': f'Connection failed: {str(e)}'}, 400

@ns.route('/<int:ds_id>/data')
class DataSourceFetchData(Resource):
    @jwt_required()
    @jwt_and_user_loader
    @ns.doc(security='jwt')
    @ns.expect(datasource_fetch_data_request, validate=True)
    @ns.marshal_with(datasource_fetch_data_response)
    @ns.response(200, 'Data fetched successfully')
    @ns.response(400, 'Invalid query or data fetching failed')
    @ns.response(404, 'Data source not found')
    @ns.response(403, 'Forbidden')
    @limiter.limit("20 per minute")
    def post(self, ds_id):
        """Fetch data from a data source using a given query configuration."""
        current_app.logger.info(f"User {current_user.id} fetching data from data source {ds_id}.")
        ds = DataSource.query.get_or_404(ds_id)
        if not (ds.owner_id == current_user.id or current_user.is_admin):
            current_app.logger.warning(f"User {current_user.id} attempted unauthorized data fetch from data source {ds.id}.")
            abort(403, message="Forbidden: You do not have access to this data source.")

        data = request.json
        query_config = data.get('query_config')

        try:
            connector = DataConnector(ds.type, ds.connection_params)
            # Add security/sanitization for query_config here! Prevent SQL injection etc.
            result_data, columns = connector.fetch_data(query_config)
            current_app.logger.info(f"Data fetched successfully from data source {ds.id}.")
            return {'data': result_data, 'columns': columns}, 200
        except Exception as e:
            current_app.logger.error(f"Failed to fetch data from data source {ds.id}: {str(e)}", exc_info=True)
            return {'status': 'failed', 'message': f'Data fetching failed: {str(e)}'}, 400

```