```python
from flask_restx import fields
from app import api

# --- Dashboard Schemas ---
dashboard_visualization_layout_model = api.model('DashboardVisualizationLayout', {
    'visualization_id': fields.Integer(required=True, description='ID of the visualization'),
    'position_x': fields.Integer(description='X position on the grid', default=0),
    'position_y': fields.Integer(description='Y position on the grid', default=0),
    'width': fields.Integer(description='Width on the grid', default=6),
    'height': fields.Integer(description='Height on the grid', default=4)
})

dashboard_request_model = api.model('DashboardRequest', {
    'name': fields.String(required=True, description='Name of the dashboard'),
    'description': fields.String(description='Description of the dashboard'),
    'is_public': fields.Boolean(description='Whether the dashboard is publicly accessible', default=False),
    'layout': fields.List(fields.Nested(dashboard_visualization_layout_model), description='Layout of visualizations on the dashboard grid')
})

# Full dashboard response model (including nested visualizations)
dashboard_response_model = api.model('DashboardResponse', {
    'id': fields.Integer(readOnly=True, description='The unique identifier of the dashboard'),
    'name': fields.String(required=True, description='Name of the dashboard'),
    'description': fields.String(description='Description of the dashboard'),
    'creator_id': fields.Integer(readOnly=True, description='ID of the user who created the dashboard'),
    'is_public': fields.Boolean(description='Whether the dashboard is publicly accessible'),
    'layout': fields.List(fields.Nested(dashboard_visualization_layout_model), description='Layout of visualizations on the dashboard grid'),
    'created_at': fields.DateTime(readOnly=True, description='Timestamp when the dashboard was created'),
    'updated_at': fields.DateTime(readOnly=True, description='Timestamp when the dashboard was last updated'),
    # For a full response, you might embed partial visualization data or just IDs
    # 'visualizations': fields.List(fields.Nested(visualization_short_model), description='Visualizations on this dashboard')
})

# For list responses
dashboard_list_model = api.model('DashboardList', {
    'dashboards': fields.List(fields.Nested(dashboard_response_model), description='List of dashboards')
})

# For specific visualization schemas needed for embedding, define them separately or import
# from .visualization import visualization_response_model as visualization_short_model
```