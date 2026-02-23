```python
from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.exceptions import NotFound, Conflict, BadRequest, InternalServerError
from backend.app.api import api_bp
from backend.app.services.data_source import DataSourceService
from backend.app.data_processing.services import DataProcessingService
from backend.app.models import data_source_schema, data_sources_schema
from backend.app.extensions import cache, limiter
from backend.app.utils.decorators import role_required

@api_bp.route('/data_sources', methods=['GET'])
@jwt_required()
@limiter.limit("60 per minute", methods=['GET'])
def get_data_sources():
    user_id = get_jwt_identity()
    try:
        data_sources = DataSourceService.get_all_data_sources(user_id)
        return jsonify(data_sources_schema.dump(data_sources)), 200
    except InternalServerError as e:
        return jsonify({"msg": e.description, "code": e.code}), e.code
    except Exception as e:
        return jsonify({"msg": str(e), "code": 500}), 500

@api_bp.route('/data_sources/<int:ds_id>', methods=['GET'])
@jwt_required()
@limiter.limit("60 per minute", methods=['GET'])
@cache.cached(timeout=60, key_prefix='data_source_by_id') # Cache individual data source for 1 min
def get_data_source(ds_id):
    user_id = get_jwt_identity()
    try:
        data_source = DataSourceService.get_data_source_by_id(ds_id, user_id)
        return jsonify(data_source_schema.dump(data_source)), 200
    except NotFound as e:
        return jsonify({"msg": e.description, "code": e.code}), e.code
    except InternalServerError as e:
        return jsonify({"msg": e.description, "code": e.code}), e.code
    except Exception as e:
        return jsonify({"msg": str(e), "code": 500}), 500

@api_bp.route('/data_sources', methods=['POST'])
@jwt_required()
@role_required('editor') # Only users with 'editor' role can create data sources
@limiter.limit("10 per hour", methods=['POST'])
def create_data_source():
    user_id = get_jwt_identity()
    data = request.get_json()
    name = data.get('name')
    type = data.get('type')
    connection_string = data.get('connection_string')

    try:
        data_source = DataSourceService.create_data_source(user_id, name, type, connection_string)
        # Invalidate cache for data source list and potentially for this specific data source if it was cached
        cache.delete_memoized(get_data_sources)
        return jsonify(data_source_schema.dump(data_source)), 201
    except (Conflict, BadRequest, InternalServerError) as e:
        return jsonify({"msg": e.description, "code": e.code}), e.code
    except Exception as e:
        return jsonify({"msg": str(e), "code": 500}), 500

@api_bp.route('/data_sources/<int:ds_id>', methods=['PUT'])
@jwt_required()
@role_required('editor')
@limiter.limit("20 per hour", methods=['PUT'])
def update_data_source(ds_id):
    user_id = get_jwt_identity()
    data = request.get_json()

    try:
        data_source = DataSourceService.update_data_source(ds_id, user_id, **data)
        # Invalidate relevant caches
        cache.delete_memoized(get_data_sources)
        cache.delete_memoized(get_data_source, ds_id)
        return jsonify(data_source_schema.dump(data_source)), 200
    except (NotFound, Conflict, BadRequest, InternalServerError) as e:
        return jsonify({"msg": e.description, "code": e.code}), e.code
    except Exception as e:
        return jsonify({"msg": str(e), "code": 500}), 500

@api_bp.route('/data_sources/<int:ds_id>', methods=['DELETE'])
@jwt_required()
@role_required('editor')
@limiter.limit("5 per hour", methods=['DELETE'])
def delete_data_source(ds_id):
    user_id = get_jwt_identity()
    try:
        result = DataSourceService.delete_data_source(ds_id, user_id)
        # Invalidate relevant caches
        cache.delete_memoized(get_data_sources)
        cache.delete_memoized(get_data_source, ds_id)
        # Also, visualizations depending on this data source might need their caches cleared
        return jsonify(result), 200
    except (NotFound, InternalServerError) as e:
        return jsonify({"msg": e.description, "code": e.code}), e.code
    except Exception as e:
        return jsonify({"msg": str(e), "code": 500}), 500

# Endpoint to execute a query against a data source
@api_bp.route('/data_sources/<int:ds_id>/query', methods=['POST'])
@jwt_required()
@limiter.limit("30 per minute", methods=['POST'])
def execute_data_source_query(ds_id):
    user_id = get_jwt_identity()
    data = request.get_json()
    query_string = data.get('query_string')

    if not query_string:
        raise BadRequest("Query string is required.")

    try:
        # DataProcessingService handles the actual execution and caching
        query_results = DataProcessingService.execute_query(ds_id, user_id, query_string)
        return jsonify(query_results), 200
    except (BadRequest, InternalServerError) as e:
        return jsonify({"msg": e.description, "code": e.code}), e.code
    except Exception as e:
        return jsonify({"msg": str(e), "code": 500}), 500

# Endpoint to get tables from a data source
@api_bp.route('/data_sources/<int:ds_id>/tables', methods=['GET'])
@jwt_required()
@limiter.limit("10 per minute", methods=['GET'])
@cache.cached(timeout=300, key_prefix='data_source_tables') # Cache table list for 5 min
def get_data_source_tables(ds_id):
    user_id = get_jwt_identity()
    try:
        tables = DataProcessingService.get_data_source_tables(ds_id, user_id)
        return jsonify(tables), 200
    except (BadRequest, InternalServerError) as e:
        return jsonify({"msg": e.description, "code": e.code}), e.code
    except Exception as e:
        return jsonify({"msg": str(e), "code": 500}), 500

# Endpoint to get columns from a specific table in a data source
@api_bp.route('/data_sources/<int:ds_id>/tables/<string:table_name>/columns', methods=['GET'])
@jwt_required()
@limiter.limit("20 per minute", methods=['GET'])
@cache.cached(timeout=300, key_prefix='data_source_table_columns') # Cache columns for 5 min
def get_data_source_table_columns(ds_id, table_name):
    user_id = get_jwt_identity()
    try:
        columns = DataProcessingService.get_data_source_columns(ds_id, user_id, table_name)
        return jsonify(columns), 200
    except (BadRequest, InternalServerError) as e:
        return jsonify({"msg": e.description, "code": e.code}), e.code
    except Exception as e:
        return jsonify({"msg": str(e), "code": 500}), 500

```