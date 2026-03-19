```python
from flask import request, current_app
from flask_restx import Resource, Namespace, abort
from flask_jwt_extended import jwt_required, current_user
from app import db, cache, limiter
from app.models.visualization import Visualization
from app.models.datasource import DataSource
from app.api.schemas.visualization import visualization_request_model, visualization_response_model, \
    visualization_list_model, visualization_data_response, message_model
from app.services.data_connector import DataConnector
from app.services.visualization_renderer import VisualizationRenderer
from app.utils.decorators import jwt_and_user_loader, cache_response
import logging

ns = Namespace('visualizations', description='Visualization management operations')

@ns.route('/')
class VisualizationList(Resource):
    @jwt_required()
    @jwt_and_user_loader
    @ns.doc(security='jwt')
    @ns.marshal_list_with(visualization_response_model)
    @ns.response(200, 'Success', visualization_list_model)
    @limiter.limit("100 per hour")
    @cache_response(timeout=60, key_prefix='visualization_list')
    def get(self):
        """Get a list of all visualizations accessible by the current user."""
        current_app.logger.info(f"User {current_user.id} fetching visualization list.")
        if current_user.is_admin:
            visualizations = Visualization.query.all()
        else:
            # Users can see their own visualizations and public ones
            visualizations = Visualization.query.filter(
                (Visualization.creator_id == current_user.id) | (Visualization.is_public == True)
            ).all()
        return visualizations, 200

    @jwt_required()
    @jwt_and_user_loader
    @ns.doc(security='jwt')
    @ns.expect(visualization_request_model, validate=True)
    @ns.marshal_with(visualization_response_model, code=201)
    @ns.response(400, 'Invalid input')
    @ns.response(404, 'Data source not found')
    @ns.response(403, 'Forbidden')
    @limiter.limit("10 per hour")
    def post(self):
        """Create a new visualization."""
        current_app.logger.info(f"User {current_user.id} creating a new visualization.")
        data = request.json

        data_source_id = data['data_source_id']
        ds = DataSource.query.get(data_source_id)
        if not ds:
            abort(404, message=f"Data source with ID {data_source_id} not found.")
        if not (ds.owner_id == current_user.id or current_user.is_admin):
            current_app.logger.warning(f"User {current_user.id} attempted to create viz with unauthorized data source {ds.id}.")
            abort(403, message="Forbidden: You can only use data sources you own.")

        new_viz = Visualization(
            name=data['name'],
            description=data.get('description'),
            type=data['type'],
            query_config=data['query_config'],
            chart_options=data['chart_options'],
            data_source_id=data_source_id,
            creator_id=current_user.id,
            is_public=data.get('is_public', False)
        )
        db.session.add(new_viz)
        db.session.commit()
        cache.clear() # Clear cache for visualization lists
        return new_viz, 201

@ns.route('/<int:viz_id>')
@ns.param('viz_id', 'The visualization identifier')
class VisualizationResource(Resource):
    @jwt_required()
    @jwt_and_user_loader
    @ns.doc(security='jwt')
    @ns.marshal_with(visualization_response_model)
    @ns.response(200, 'Success')
    @ns.response(404, 'Visualization not found')
    @ns.response(403, 'Forbidden')
    @limiter.limit("60 per hour")
    @cache_response(timeout=300, key_prefix='visualization_detail')
    def get(self, viz_id):
        """Retrieve a specific visualization."""
        current_app.logger.info(f"User {current_user.id} fetching visualization {viz_id}.")
        viz = Visualization.query.get_or_404(viz_id)
        if not (viz.creator_id == current_user.id or viz.is_public or current_user.is_admin):
            current_app.logger.warning(f"User {current_user.id} attempted unauthorized access to visualization {viz.id}.")
            abort(403, message="Forbidden: You do not have access to this visualization.")
        return viz, 200

    @jwt_required()
    @jwt_and_user_loader
    @ns.doc(security='jwt')
    @ns.expect(visualization_request_model, validate=True)
    @ns.marshal_with(visualization_response_model)
    @ns.response(200, 'Visualization updated successfully')
    @ns.response(404, 'Visualization not found or Data source not found')
    @ns.response(403, 'Forbidden')
    @limiter.limit("30 per hour")
    def put(self, viz_id):
        """Update an existing visualization."""
        current_app.logger.info(f"User {current_user.id} updating visualization {viz_id}.")
        viz = Visualization.query.get_or_404(viz_id)
        if not (viz.creator_id == current_user.id or current_user.is_admin):
            current_app.logger.warning(f"User {current_user.id} attempted unauthorized update of visualization {viz.id}.")
            abort(403, message="Forbidden: You can only update visualizations you own.")

        data = request.json
        data_source_id = data['data_source_id']
        ds = DataSource.query.get(data_source_id)
        if not ds:
            abort(404, message=f"Data source with ID {data_source_id} not found.")
        if not (ds.owner_id == current_user.id or current_user.is_admin):
            current_app.logger.warning(f"User {current_user.id} tried to update viz {viz.id} with unauthorized data source {ds.id}.")
            abort(403, message="Forbidden: You can only use data sources you own.")

        viz.name = data['name']
        viz.description = data.get('description')
        viz.type = data['type']
        viz.query_config = data['query_config']
        viz.chart_options = data['chart_options']
        viz.data_source_id = data_source_id
        viz.is_public = data.get('is_public', False)
        viz.updated_at = db.func.now()
        db.session.commit()
        cache.delete_memoized(self.get, viz_id) # Clear cache for this specific visualization
        cache.clear() # Clear general visualization list cache
        return viz, 200

    @jwt_required()
    @jwt_and_user_loader
    @ns.doc(security='jwt')
    @ns.response(204, 'Visualization deleted successfully', model=message_model)
    @ns.response(404, 'Visualization not found')
    @ns.response(403, 'Forbidden')
    @limiter.limit("5 per hour")
    def delete(self, viz_id):
        """Delete a visualization."""
        current_app.logger.info(f"User {current_user.id} deleting visualization {viz_id}.")
        viz = Visualization.query.get_or_404(viz_id)
        if not (viz.creator_id == current_user.id or current_user.is_admin):
            current_app.logger.warning(f"User {current_user.id} attempted unauthorized deletion of visualization {viz.id}.")
            abort(403, message="Forbidden: You can only delete visualizations you own.")
        db.session.delete(viz)
        db.session.commit()
        cache.clear() # Clear all visualization caches
        return {'message': 'Visualization deleted successfully'}, 204

@ns.route('/<int:viz_id>/data')
class VisualizationData(Resource):
    @jwt_required()
    @jwt_and_user_loader
    @ns.doc(security='jwt')
    @ns.marshal_with(visualization_data_response)
    @ns.response(200, 'Data and chart options fetched successfully')
    @ns.response(404, 'Visualization or Data source not found')
    @ns.response(403, 'Forbidden')
    @ns.response(400, 'Data fetching or rendering failed')
    @limiter.limit("30 per minute")
    @cache_response(timeout=180, key_prefix='visualization_data') # Cache visualization data for 3 minutes
    def get(self, viz_id):
        """Fetch data and dynamic chart options for a specific visualization."""
        current_app.logger.info(f"User {current_user.id} fetching data for visualization {viz_id}.")
        viz = Visualization.query.get_or_404(viz_id)
        if not (viz.creator_id == current_user.id or viz.is_public or current_user.is_admin):
            current_app.logger.warning(f"User {current_user.id} attempted unauthorized data fetch for visualization {viz.id}.")
            abort(403, message="Forbidden: You do not have access to this visualization.")

        ds = DataSource.query.get(viz.data_source_id)
        if not ds:
            abort(404, message=f"Associated data source with ID {viz.data_source_id} not found.")

        try:
            # 1. Fetch data from the data source
            connector = DataConnector(ds.type, ds.connection_params)
            # IMPORTANT: Sanitize viz.query_config here before executing!
            raw_data, columns = connector.fetch_data(viz.query_config)

            # 2. Process data and generate/update chart options
            renderer = VisualizationRenderer()
            processed_data, dynamic_chart_options = renderer.render_chart(viz.type, raw_data, viz.chart_options)

            current_app.logger.info(f"Data and chart options generated for visualization {viz.id}.")
            return {
                'visualization_id': viz.id,
                'data': processed_data,
                'chart_options': dynamic_chart_options
            }, 200
        except Exception as e:
            current_app.logger.error(f"Failed to fetch data or render visualization {viz.id}: {str(e)}", exc_info=True)
            abort(400, message=f"Data fetching or rendering failed: {str(e)}")

```