```python
from backend.app.models import DataSource, data_source_schema, db
from werkzeug.exceptions import NotFound, Conflict, BadRequest, InternalServerError

class DataSourceService:
    @staticmethod
    def get_all_data_sources(user_id):
        """Fetches all data sources belonging to a user."""
        return DataSource.query.filter_by(user_id=user_id).all()

    @staticmethod
    def get_data_source_by_id(data_source_id, user_id):
        """Fetches a specific data source by ID for a user."""
        data_source = DataSource.query.filter_by(id=data_source_id, user_id=user_id).first()
        if not data_source:
            raise NotFound("Data source not found or you do not have permission.")
        return data_source

    @staticmethod
    def create_data_source(user_id, name, type, connection_string):
        """Creates a new data source."""
        if DataSource.query.filter_by(user_id=user_id, name=name).first():
            raise Conflict(f"A data source with the name '{name}' already exists for this user.")

        # Basic validation for connection_string based on type (can be expanded)
        if not connection_string or not isinstance(connection_string, str):
            raise BadRequest("Connection string is required and must be a string.")

        # In a real application, connection_string should be encrypted before saving.
        # This is a critical security consideration.

        data_source = DataSource(
            user_id=user_id,
            name=name,
            type=type,
            connection_string=connection_string
        )
        try:
            data_source.save()
            return data_source
        except Exception as e:
            db.session.rollback()
            raise InternalServerError(f"Failed to create data source: {e}")

    @staticmethod
    def update_data_source(data_source_id, user_id, **kwargs):
        """Updates an existing data source."""
        data_source = DataSourceService.get_data_source_by_id(data_source_id, user_id)

        # Prevent changing user_id or id through update
        kwargs.pop('user_id', None)
        kwargs.pop('id', None)

        if 'name' in kwargs and DataSource.query.filter(
            DataSource.user_id == user_id,
            DataSource.name == kwargs['name'],
            DataSource.id != data_source_id
        ).first():
            raise Conflict(f"A data source with the name '{kwargs['name']}' already exists for this user.")

        try:
            data_source.update(**kwargs)
            return data_source
        except Exception as e:
            db.session.rollback()
            raise InternalServerError(f"Failed to update data source: {e}")


    @staticmethod
    def delete_data_source(data_source_id, user_id):
        """Deletes a data source."""
        data_source = DataSourceService.get_data_source_by_id(data_source_id, user_id)
        try:
            data_source.delete()
            return {"message": "Data source deleted successfully."}
        except Exception as e:
            db.session.rollback()
            raise InternalServerError(f"Failed to delete data source: {e}")

```