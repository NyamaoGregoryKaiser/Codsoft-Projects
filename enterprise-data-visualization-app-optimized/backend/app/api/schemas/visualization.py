```python
from flask_restx import fields
from app import api

# --- Visualization Schemas ---
visualization_request_model = api.model('VisualizationRequest', {
    'name': fields.String(required=True, description='Name of the visualization'),
    'description': fields.String(description='Description of the visualization'),
    'type': fields.String(required=True, enum=['bar', 'line', 'pie', 'scatter', 'table', 'gauge'], description='Type of visualization'),
    'query_config': fields.Raw(required=True, description='JSON object containing query details (e.g., SQL, API path, filters)'),
    'chart_options': fields.Raw(required=True, description='JSON object with chart configuration (e.g., ECharts options)'),
    'data_source_id': fields.Integer(required=True, description='ID of the associated data source'),
    'is_public': fields.Boolean(description='Whether the visualization is publicly accessible', default=False)
})

visualization_response_model = api.model('VisualizationResponse', {
    'id': fields.Integer(readOnly=True, description='The unique identifier of the visualization'),
    'name': fields.String(required=True, description='Name of the visualization'),
    'description': fields.String(description='Description of the visualization'),
    'type': fields.String(required=True, description='Type of visualization'),
    'query_config': fields.Raw(required=True, description='JSON object containing query details'),
    'chart_options': fields.Raw(required=True, description='JSON object with chart configuration'),
    'data_source_id': fields.Integer(required=True, description='ID of the associated data source'),
    'creator_id': fields.Integer(readOnly=True, description='ID of the user who created the visualization'),
    'is_public': fields.Boolean(description='Whether the visualization is publicly accessible'),
    'created_at': fields.DateTime(readOnly=True, description='Timestamp when the visualization was created'),
    'updated_at': fields.DateTime(readOnly=True, description='Timestamp when the visualization was last updated')
})

visualization_list_model = api.model('VisualizationList', {
    'visualizations': fields.List(fields.Nested(visualization_response_model), description='List of visualizations')
})

visualization_data_response = api.model('VisualizationDataResponse', {
    'visualization_id': fields.Integer(description='ID of the visualization'),
    'data': fields.List(fields.Raw, description='Processed data for the visualization'),
    'chart_options': fields.Raw(description='Dynamic chart options, potentially updated with fetched data')
})
```