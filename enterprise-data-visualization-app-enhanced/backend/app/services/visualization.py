```python
from backend.app.models import Visualization, visualization_schema, db
from werkzeug.exceptions import NotFound, Conflict, BadRequest, InternalServerError

class VisualizationService:
    @staticmethod
    def get_all_visualizations(user_id):
        """Fetches all visualizations belonging to a user."""
        return Visualization.query.filter_by(user_id=user_id).all()

    @staticmethod
    def get_visualization_by_id(viz_id, user_id):
        """Fetches a specific visualization by ID for a user."""
        visualization = Visualization.query.filter_by(id=viz_id, user_id=user_id).first()
        if not visualization:
            raise NotFound("Visualization not found or you do not have permission.")
        return visualization

    @staticmethod
    def create_visualization(user_id, name, description, chart_type, query_config, chart_config, data_source_id):
        """Creates a new visualization."""
        if Visualization.query.filter_by(user_id=user_id, name=name).first():
            raise Conflict(f"A visualization with the name '{name}' already exists for this user.")

        # Basic validation for chart_type and configs
        if not chart_type or not query_config or not chart_config:
            raise BadRequest("Chart type, query config, and chart config are required.")
        if not isinstance(query_config, dict) or not isinstance(chart_config, dict):
            raise BadRequest("Query config and chart config must be JSON objects.")

        visualization = Visualization(
            user_id=user_id,
            name=name,
            description=description,
            chart_type=chart_type,
            query_config=query_config,
            chart_config=chart_config,
            data_source_id=data_source_id
        )
        try:
            visualization.save()
            return visualization
        except Exception as e:
            db.session.rollback()
            raise InternalServerError(f"Failed to create visualization: {e}")

    @staticmethod
    def update_visualization(viz_id, user_id, **kwargs):
        """Updates an existing visualization."""
        visualization = VisualizationService.get_visualization_by_id(viz_id, user_id)

        kwargs.pop('user_id', None)
        kwargs.pop('id', None)

        if 'name' in kwargs and Visualization.query.filter(
            Visualization.user_id == user_id,
            Visualization.name == kwargs['name'],
            Visualization.id != viz_id
        ).first():
            raise Conflict(f"A visualization with the name '{kwargs['name']}' already exists for this user.")

        # Validate JSON fields if present
        if 'query_config' in kwargs and not isinstance(kwargs['query_config'], dict):
            raise BadRequest("Query config must be a JSON object.")
        if 'chart_config' in kwargs and not isinstance(kwargs['chart_config'], dict):
            raise BadRequest("Chart config must be a JSON object.")

        try:
            visualization.update(**kwargs)
            return visualization
        except Exception as e:
            db.session.rollback()
            raise InternalServerError(f"Failed to update visualization: {e}")

    @staticmethod
    def delete_visualization(viz_id, user_id):
        """Deletes a visualization."""
        visualization = VisualizationService.get_visualization_by_id(viz_id, user_id)
        try:
            db.session.delete(visualization)
            # Remove from any dashboards it's linked to (handled by SQLAlchemy backref default cascade)
            db.session.commit()
            return {"message": "Visualization deleted successfully."}
        except Exception as e:
            db.session.rollback()
            raise InternalServerError(f"Failed to delete visualization: {e}")

```