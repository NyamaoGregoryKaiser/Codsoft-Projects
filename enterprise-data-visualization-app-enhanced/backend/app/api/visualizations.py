```python
from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.exceptions import NotFound, Conflict, BadRequest, InternalServerError
from backend.app.api import api_bp
from backend.app.services.visualization import VisualizationService
from backend.app.data_processing.services import DataProcessingService
from backend.app.models import visualization_schema, visualizations_schema
from backend.app.extensions import cache, limiter
from backend.app.utils.decorators import role_required

@api_bp.route('/visualizations', methods=['GET'])
@jwt_required()
@limiter.limit("60 per minute", methods=['GET'])
def get_visualizations():
    user_id = get_jwt_identity()
    try:
        visualizations = VisualizationService.get_all_visualizations(user_id)
        return jsonify(visualizations_schema.dump(visualizations)), 200
    except InternalServerError as e:
        return jsonify({"msg": e.description, "code": e.code}), e.code
    except Exception as e:
        return jsonify({"msg": str(e), "code": 500}), 500

@api_bp.route('/visualizations/<int:viz_id>', methods=['GET'])
@jwt_required()
@limiter.limit("60 per minute", methods=['GET'])
@cache.cached(timeout=60, key_prefix='visualization_by_id')
def get_visualization(viz_id):
    user_id = get_jwt_identity()
    try:
        visualization = VisualizationService.get_visualization_by_id(viz_id, user_id)
        return jsonify(visualization_schema.dump(visualization)), 200
    except NotFound as e:
        return jsonify({"msg": e.description, "code": e.code}), e.code
    except InternalServerError as e:
        return jsonify({"msg": e.description, "code": e.code}), e.code
    except Exception as e:
        return jsonify({"msg": str(e), "code": 500}), 500

@api_bp.route('/visualizations', methods=['POST'])
@jwt_required()
@role_required('editor')
@limiter.limit("10 per hour", methods=['POST'])
def create_visualization():
    user_id = get_jwt_identity()
    data = request.get_json()
    name = data.get('name')
    description = data.get('description')
    chart_type = data.get('chart_type')
    query_config = data.get('query_config')
    chart_config = data.get('chart_config')
    data_source_id = data.get('data_source_id')

    try:
        visualization = VisualizationService.create_visualization(
            user_id, name, description, chart_type, query_config, chart_config, data_source_id
        )
        cache.delete_memoized(get_visualizations) # Invalidate list cache
        return jsonify(visualization_schema.dump(visualization)), 201
    except (Conflict, BadRequest, InternalServerError) as e:
        return jsonify({"msg": e.description, "code": e.code}), e.code
    except Exception as e:
        return jsonify({"msg": str(e), "code": 500}), 500

@api_bp.route('/visualizations/<int:viz_id>', methods=['PUT'])
@jwt_required()
@role_required('editor')
@limiter.limit("20 per hour", methods=['PUT'])
def update_visualization(viz_id):
    user_id = get_jwt_identity()
    data = request.get_json()

    try:
        visualization = VisualizationService.update_visualization(viz_id, user_id, **data)
        # Invalidate caches related to this viz
        cache.delete_memoized(get_visualizations)
        cache.delete_memoized(get_visualization, viz_id)
        # Also invalidate data processing cache if query_config changed
        if 'query_config' in data or 'data_source_id' in data:
            # Need to figure out the exact key used by DataProcessingService.execute_query
            # For simplicity, we might clear all `execute_query` caches related to this viz's data source,
            # or add a more specific cache key that includes viz_id and query hash.
            # Example: cache.delete_memoized(DataProcessingService.execute_query, viz.data_source_id, user_id, viz.query_config['query_string'])
            pass
        return jsonify(visualization_schema.dump(visualization)), 200
    except (NotFound, Conflict, BadRequest, InternalServerError) as e:
        return jsonify({"msg": e.description, "code": e.code}), e.code
    except Exception as e:
        return jsonify({"msg": str(e), "code": 500}), 500

@api_bp.route('/visualizations/<int:viz_id>', methods=['DELETE'])
@jwt_required()
@role_required('editor')
@limiter.limit("5 per hour", methods=['DELETE'])
def delete_visualization(viz_id):
    user_id = get_jwt_identity()
    try:
        result = VisualizationService.delete_visualization(viz_id, user_id)
        # Invalidate caches
        cache.delete_memoized(get_visualizations)
        cache.delete_memoized(get_visualization, viz_id)
        # Dashboards containing this visualization might also need cache invalidation
        # For a truly robust system, this would involve more complex cache invalidation strategies
        return jsonify(result), 200
    except (NotFound, InternalServerError) as e:
        return jsonify({"msg": e.description, "code": e.code}), e.code
    except Exception as e:
        return jsonify({"msg": str(e), "code": 500}), 500

# Endpoint to get data for a specific visualization
@api_bp.route('/visualizations/<int:viz_id>/data', methods=['GET'])
@jwt_required()
@limiter.limit("60 per minute", methods=['GET'])
# This cache is for the *rendered data* of a visualization, useful if the query_config is stable
@cache.cached(timeout=180, key_prefix='visualization_data') # Cache visualization data for 3 min
def get_visualization_data(viz_id):
    user_id = get_jwt_identity()
    try:
        visualization = VisualizationService.get_visualization_by_id(viz_id, user_id)
        query_results = DataProcessingService.execute_query(
            visualization.data_source_id,
            user_id,
            visualization.query_config.get('query_string', '')
        )
        return jsonify(query_results), 200
    except (NotFound, BadRequest, InternalServerError) as e:
        return jsonify({"msg": e.description, "code": e.code}), e.code
    except Exception as e:
        return jsonify({"msg": str(e), "code": 500}), 500

```