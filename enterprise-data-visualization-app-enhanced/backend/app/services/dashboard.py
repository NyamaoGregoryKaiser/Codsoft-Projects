```python
from backend.app.models import Dashboard, Visualization, dashboard_schema, db
from werkzeug.exceptions import NotFound, Conflict, BadRequest, InternalServerError

class DashboardService:
    @staticmethod
    def get_all_dashboards(user_id):
        """Fetches all dashboards belonging to a user."""
        return Dashboard.query.filter_by(user_id=user_id).all()

    @staticmethod
    def get_dashboard_by_id(dashboard_id, user_id):
        """Fetches a specific dashboard by ID for a user."""
        dashboard = Dashboard.query.filter_by(id=dashboard_id, user_id=user_id).first()
        if not dashboard:
            raise NotFound("Dashboard not found or you do not have permission.")
        return dashboard

    @staticmethod
    def get_public_dashboard_by_id(dashboard_id):
        """Fetches a public dashboard by ID."""
        dashboard = Dashboard.query.filter_by(id=dashboard_id, is_public=True).first()
        if not dashboard:
            raise NotFound("Public dashboard not found.")
        return dashboard

    @staticmethod
    def create_dashboard(user_id, name, description, layout, visualization_ids, is_public=False):
        """Creates a new dashboard."""
        if Dashboard.query.filter_by(user_id=user_id, name=name).first():
            raise Conflict(f"A dashboard with the name '{name}' already exists for this user.")

        if not isinstance(layout, dict):
            raise BadRequest("Layout must be a JSON object.")
        if not isinstance(visualization_ids, list):
            raise BadRequest("Visualization IDs must be a list.")

        visualizations = Visualization.query.filter(
            Visualization.id.in_(visualization_ids),
            Visualization.user_id == user_id
        ).all()

        if len(visualizations) != len(visualization_ids):
            missing_ids = set(visualization_ids) - set(v.id for v in visualizations)
            raise BadRequest(f"One or more visualizations not found or not owned by user: {list(missing_ids)}")

        dashboard = Dashboard(
            user_id=user_id,
            name=name,
            description=description,
            layout=layout,
            is_public=is_public,
            visualizations=visualizations # Assign the list of visualization objects
        )
        try:
            dashboard.save()
            return dashboard
        except Exception as e:
            db.session.rollback()
            raise InternalServerError(f"Failed to create dashboard: {e}")

    @staticmethod
    def update_dashboard(dashboard_id, user_id, **kwargs):
        """Updates an existing dashboard."""
        dashboard = DashboardService.get_dashboard_by_id(dashboard_id, user_id)

        kwargs.pop('user_id', None)
        kwargs.pop('id', None)

        if 'name' in kwargs and Dashboard.query.filter(
            Dashboard.user_id == user_id,
            Dashboard.name == kwargs['name'],
            Dashboard.id != dashboard_id
        ).first():
            raise Conflict(f"A dashboard with the name '{kwargs['name']}' already exists for this user.")

        if 'layout' in kwargs and not isinstance(kwargs['layout'], dict):
            raise BadRequest("Layout must be a JSON object.")

        if 'visualization_ids' in kwargs:
            visualization_ids = kwargs.pop('visualization_ids')
            if not isinstance(visualization_ids, list):
                raise BadRequest("Visualization IDs must be a list.")

            visualizations = Visualization.query.filter(
                Visualization.id.in_(visualization_ids),
                Visualization.user_id == user_id
            ).all()

            if len(visualizations) != len(visualization_ids):
                missing_ids = set(visualization_ids) - set(v.id for v in visualizations)
                raise BadRequest(f"One or more visualizations not found or not owned by user: {list(missing_ids)}")
            dashboard.visualizations = visualizations # Update relationships

        try:
            dashboard.update(**kwargs)
            return dashboard
        except Exception as e:
            db.session.rollback()
            raise InternalServerError(f"Failed to update dashboard: {e}")

    @staticmethod
    def delete_dashboard(dashboard_id, user_id):
        """Deletes a dashboard."""
        dashboard = DashboardService.get_dashboard_by_id(dashboard_id, user_id)
        try:
            dashboard.delete()
            return {"message": "Dashboard deleted successfully."}
        except Exception as e:
            db.session.rollback()
            raise InternalServerError(f"Failed to delete dashboard: {e}")

```