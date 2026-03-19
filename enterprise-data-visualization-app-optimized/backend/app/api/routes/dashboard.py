```python
from flask import request, current_app
from flask_restx import Resource, Namespace, abort
from flask_jwt_extended import jwt_required, current_user
from app import db, cache, limiter
from app.models.dashboard import Dashboard, dashboard_visualizations
from app.models.visualization import Visualization
from app.api.schemas.dashboard import dashboard_request_model, dashboard_response_model, dashboard_list_model, message_model
from app.utils.decorators import jwt_and_user_loader, cache_response
import logging

ns = Namespace('dashboards', description='Dashboard management operations')

@ns.route('/')
class DashboardList(Resource):
    @jwt_required()
    @jwt_and_user_loader
    @ns.doc(security='jwt')
    @ns.marshal_list_with(dashboard_response_model)
    @ns.response(200, 'Success', dashboard_list_model)
    @limiter.limit("100 per hour")
    @cache_response(timeout=60, key_prefix='dashboard_list')
    def get(self):
        """Get a list of all dashboards accessible by the current user."""
        current_app.logger.info(f"User {current_user.id} fetching dashboard list.")
        if current_user.is_admin:
            dashboards = Dashboard.query.all()
        else:
            # Users can see their own dashboards and public ones
            dashboards = Dashboard.query.filter(
                (Dashboard.creator_id == current_user.id) | (Dashboard.is_public == True)
            ).all()

        # Manually include layout details from association table
        results = []
        for dashboard in dashboards:
            layout_details = []
            for viz_assoc in db.session.query(dashboard_visualizations).filter_by(dashboard_id=dashboard.id).all():
                layout_details.append({
                    'visualization_id': viz_assoc.visualization_id,
                    'position_x': viz_assoc.position_x,
                    'position_y': viz_assoc.position_y,
                    'width': viz_assoc.width,
                    'height': viz_assoc.height
                })
            dashboard_dict = {
                'id': dashboard.id,
                'name': dashboard.name,
                'description': dashboard.description,
                'creator_id': dashboard.creator_id,
                'is_public': dashboard.is_public,
                'created_at': dashboard.created_at.isoformat(),
                'updated_at': dashboard.updated_at.isoformat(),
                'layout': layout_details
            }
            results.append(dashboard_dict)
        return results, 200

    @jwt_required()
    @jwt_and_user_loader
    @ns.doc(security='jwt')
    @ns.expect(dashboard_request_model, validate=True)
    @ns.marshal_with(dashboard_response_model, code=201)
    @ns.response(400, 'Invalid input')
    @limiter.limit("10 per hour")
    def post(self):
        """Create a new dashboard."""
        current_app.logger.info(f"User {current_user.id} creating a new dashboard.")
        data = request.json
        new_dashboard = Dashboard(
            name=data['name'],
            description=data.get('description'),
            is_public=data.get('is_public', False),
            creator_id=current_user.id
        )
        db.session.add(new_dashboard)
        db.session.commit() # Commit to get dashboard.id for layout association

        if 'layout' in data and isinstance(data['layout'], list):
            for viz_layout in data['layout']:
                viz_id = viz_layout.get('visualization_id')
                if viz_id:
                    visualization = Visualization.query.get(viz_id)
                    if not visualization:
                        current_app.logger.warning(f"Visualization ID {viz_id} not found when creating dashboard {new_dashboard.id}.")
                        continue # Skip invalid visualization IDs
                    if visualization.creator_id != current_user.id and not visualization.is_public and not current_user.is_admin:
                        current_app.logger.warning(f"User {current_user.id} tried to add unauthorized viz {viz_id} to dashboard {new_dashboard.id}.")
                        continue # User cannot add private viz they don't own

                    new_dashboard.visualizations.append(visualization)
                    # Update association table attributes manually if necessary
                    # For complex layout, better to create a new association object directly
                    stmt = dashboard_visualizations.insert().values(
                        dashboard_id=new_dashboard.id,
                        visualization_id=viz_id,
                        position_x=viz_layout.get('position_x', 0),
                        position_y=viz_layout.get('position_y', 0),
                        width=viz_layout.get('width', 6),
                        height=viz_layout.get('height', 4)
                    )
                    db.session.execute(stmt)
            db.session.commit()

        cache.clear() # Clear cache for dashboard lists
        return new_dashboard, 201

@ns.route('/<int:dashboard_id>')
@ns.param('dashboard_id', 'The dashboard identifier')
class DashboardResource(Resource):
    @jwt_required()
    @jwt_and_user_loader
    @ns.doc(security='jwt')
    @ns.marshal_with(dashboard_response_model)
    @ns.response(200, 'Success')
    @ns.response(404, 'Dashboard not found')
    @ns.response(403, 'Forbidden')
    @limiter.limit("60 per hour")
    @cache_response(timeout=300, key_prefix='dashboard_detail')
    def get(self, dashboard_id):
        """Retrieve a specific dashboard."""
        current_app.logger.info(f"User {current_user.id} fetching dashboard {dashboard_id}.")
        dashboard = Dashboard.query.get_or_404(dashboard_id)

        if not (dashboard.creator_id == current_user.id or dashboard.is_public or current_user.is_admin):
            current_app.logger.warning(f"User {current_user.id} attempted unauthorized access to dashboard {dashboard.id}.")
            abort(403, message="Forbidden: You do not have access to this dashboard.")

        layout_details = []
        for viz_assoc in db.session.query(dashboard_visualizations).filter_by(dashboard_id=dashboard.id).all():
            layout_details.append({
                'visualization_id': viz_assoc.visualization_id,
                'position_x': viz_assoc.position_x,
                'position_y': viz_assoc.position_y,
                'width': viz_assoc.width,
                'height': viz_assoc.height
            })
        dashboard_dict = {
            'id': dashboard.id,
            'name': dashboard.name,
            'description': dashboard.description,
            'creator_id': dashboard.creator_id,
            'is_public': dashboard.is_public,
            'created_at': dashboard.created_at.isoformat(),
            'updated_at': dashboard.updated_at.isoformat(),
            'layout': layout_details
        }
        return dashboard_dict, 200

    @jwt_required()
    @jwt_and_user_loader
    @ns.doc(security='jwt')
    @ns.expect(dashboard_request_model, validate=True)
    @ns.marshal_with(dashboard_response_model)
    @ns.response(200, 'Dashboard updated successfully')
    @ns.response(404, 'Dashboard not found')
    @ns.response(403, 'Forbidden')
    @limiter.limit("30 per hour")
    def put(self, dashboard_id):
        """Update an existing dashboard."""
        current_app.logger.info(f"User {current_user.id} updating dashboard {dashboard_id}.")
        dashboard = Dashboard.query.get_or_404(dashboard_id)

        if not (dashboard.creator_id == current_user.id or current_user.is_admin):
            current_app.logger.warning(f"User {current_user.id} attempted unauthorized update of dashboard {dashboard.id}.")
            abort(403, message="Forbidden: You can only update dashboards you own.")

        data = request.json
        dashboard.name = data['name']
        dashboard.description = data.get('description')
        dashboard.is_public = data.get('is_public', False)
        dashboard.updated_at = db.func.now()

        # Handle layout updates (more complex, requires careful synchronization)
        if 'layout' in data:
            # Clear existing associations for this dashboard
            db.session.execute(dashboard_visualizations.delete().where(dashboard_visualizations.c.dashboard_id == dashboard.id))
            db.session.flush() # Ensure deletions are processed before new insertions

            for viz_layout in data['layout']:
                viz_id = viz_layout.get('visualization_id')
                if viz_id:
                    visualization = Visualization.query.get(viz_id)
                    if not visualization:
                        current_app.logger.warning(f"Visualization ID {viz_id} not found during update of dashboard {dashboard.id}.")
                        continue
                    if visualization.creator_id != current_user.id and not visualization.is_public and not current_user.is_admin:
                        current_app.logger.warning(f"User {current_user.id} tried to add unauthorized viz {viz_id} to dashboard {dashboard.id} during update.")
                        continue

                    stmt = dashboard_visualizations.insert().values(
                        dashboard_id=dashboard.id,
                        visualization_id=viz_id,
                        position_x=viz_layout.get('position_x', 0),
                        position_y=viz_layout.get('position_y', 0),
                        width=viz_layout.get('width', 6),
                        height=viz_layout.get('height', 4)
                    )
                    db.session.execute(stmt)

        db.session.commit()
        cache.delete_memoized(self.get, dashboard_id) # Clear cache for this specific dashboard
        cache.clear() # Clear general dashboard list cache
        return dashboard, 200

    @jwt_required()
    @jwt_and_user_loader
    @ns.doc(security='jwt')
    @ns.response(204, 'Dashboard deleted successfully', model=message_model)
    @ns.response(404, 'Dashboard not found')
    @ns.response(403, 'Forbidden')
    @limiter.limit("5 per hour")
    def delete(self, dashboard_id):
        """Delete a dashboard."""
        current_app.logger.info(f"User {current_user.id} deleting dashboard {dashboard_id}.")
        dashboard = Dashboard.query.get_or_404(dashboard_id)

        if not (dashboard.creator_id == current_user.id or current_user.is_admin):
            current_app.logger.warning(f"User {current_user.id} attempted unauthorized deletion of dashboard {dashboard.id}.")
            abort(403, message="Forbidden: You can only delete dashboards you own.")

        db.session.delete(dashboard)
        db.session.commit()
        cache.clear() # Clear all dashboard caches
        return {'message': 'Dashboard deleted successfully'}, 204
```