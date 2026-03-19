```python
from flask_restx import fields
from app import api

# --- DataSource Schemas ---
datasource_request_model = api.model('DataSourceRequest', {
    'name': fields.String(required=True, description='Name of the data source'),
    'type': fields.String(required=True, enum=['postgresql', 'mysql', 'sqlite', 'csv', 'api'], description='Type of the data source'),
    'connection_params': fields.Raw(required=True, description='JSON object containing connection parameters (e.g., host, port, user, dbname, path for CSV, URL for API). Sensitive data should be handled carefully.')
})

datasource_response_model = api.model('DataSourceResponse', {
    'id': fields.Integer(readOnly=True, description='The unique identifier of the data source'),
    'name': fields.String(required=True, description='Name of the data source'),
    'type': fields.String(required=True, description='Type of the data source'),
    'owner_id': fields.Integer(readOnly=True, description='ID of the user who owns the data source'),
    'created_at': fields.DateTime(readOnly=True, description='Timestamp when the data source was created'),
    'updated_at': fields.DateTime(readOnly=True, description='Timestamp when the data source was last updated'),
    # connection_params are generally NOT returned in full for security,
    # or only a masked version is returned. For simplicity, we omit it from full response here.
    # 'connection_params_masked': fields.String(description='Masked connection parameters')
})

datasource_list_model = api.model('DataSourceList', {
    'data_sources': fields.List(fields.Nested(datasource_response_model), description='List of data sources')
})

# Model for testing connection
datasource_test_model = api.model('DataSourceTest', {
    'status': fields.String(required=True, description='Connection status'),
    'message': fields.String(description='Details about the connection attempt')
})

# Model for fetching data (requires query configuration)
datasource_fetch_data_request = api.model('DataSourceFetchDataRequest', {
    'query_config': fields.Raw(required=True, description='JSON object defining the query (e.g., SQL string, API endpoint & params)')
})

datasource_fetch_data_response = api.model('DataSourceFetchDataResponse', {
    'data': fields.List(fields.Raw, description='List of data rows (JSON objects)'),
    'columns': fields.List(fields.String, description='List of column names')
})
```