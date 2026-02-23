```python
from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.exceptions import NotFound, Conflict, BadRequest, InternalServerError
from backend.app.api import api_bp
from backend.app.services.dashboard import DashboardService
from backend.app.models import dashboard_schema, dashboards_schema
from backend.app.extensions import cache, limiter
from backend.app.utils.decorators import role_required

@api_bp.route('/dashboards', methods=['GET'])
@jwt_required()
@limiter.limit("60 per minute", methods=['GET'])
def get_dashboards():
    user_id = get_jwt_identity()
    try:
        dashboards = DashboardService.get_all_dashboards(user_id)
        return jsonify(dashboards_schema.dump(dashboards)), 200
    except InternalServerError as e:
        return jsonify({"msg": e.description, "code": e.code}), e.code
    except Exception as e:
        return jsonify({"msg": str(e), "code": 500}), 500

@api_bp.route('/dashboards/<int:dashboard_id>', methods=['GET'])
@jwt_required()
@limiter.limit("60 per minute", methods=['GET'])
@cache.cached(timeout=60, key_prefix='dashboard_by_id')
def get_dashboard(dashboard_id):
    user_id = get_jwt_identity()
    try:
        dashboard = DashboardService.get_dashboard_by_id(dashboard_id, user_id)
        return jsonify(dashboard_schema.dump(dashboard)), 200
    except NotFound as e:
        return jsonify({"msg": e.description, "code": e.code}), e.code
    except InternalServerError as e:
        return jsonify({"msg": e.description, "code": e.code}), e.code
    except Exception as e:
        return jsonify({"msg": str(e), "code": 500}), 500

@api_bp.route('/dashboards/public/<int:dashboard_id>', methods=['GET'])
@limiter.limit("100 per minute", methods=['GET'])
@cache.cached(timeout=300, key_prefix='public_dashboard_by_id') # Public dashboards can be cached longer
def get_public_dashboard(dashboard_id):
    try:
        dashboard = DashboardService.get_public_dashboard_by_id(dashboard_id)
        return jsonify(dashboard_schema.dump(dashboard)), 200
    except NotFound as e:
        return jsonify({"msg": e.description, "code": e.code}), e.code
    except InternalServerError as e:
        return jsonify({"msg": e.description, "code": e.code}), e.code
    except Exception as e:
        return jsonify({"msg": str(e), "code": 500}), 500


@api_bp.route('/dashboards', methods=['POST'])
@jwt_required()
@role_required('editor')
@limiter.limit("10 per hour", methods=['POST'])
def create_dashboard():
    user_id = get_jwt_identity()
    data = request.get_json()
    name = data.get('name')
    description = data.get('description')
    layout = data.get('layout')
    visualization_ids = data.get('visualization_ids', [])
    is_public = data.get('is_public', False)

    try:
        dashboard = DashboardService.create_dashboard(
            user_id, name, description, layout, visualization_ids, is_public
        )
        cache.delete_memoized(get_dashboards)
        return jsonify(dashboard_schema.dump(dashboard)), 201
    except (Conflict, BadRequest, InternalServerError) as e:
        return jsonify({"msg": e.description, "code": e.code}), e.code
    except Exception as e:
        return jsonify({"msg": str(e), "code": 500}), 500

@api_bp.route('/dashboards/<int:dashboard_id>', methods=['PUT'])
@jwt_required()
@role_required('editor')
@limiter.limit("20 per hour", methods=['PUT'])
def update_dashboard(dashboard_id):
    user_id = get_jwt_identity()
    data = request.get_json()

    try:
        dashboard = DashboardService.update_dashboard(dashboard_id, user_id, **data)
        cache.delete_memoized(get_dashboards)
        cache.delete_memoized(get_dashboard, dashboard_id)
        if dashboard.is_public: # Invalidate public cache if the dashboard is public
            cache.delete_memoized(get_public_dashboard, dashboard_id)
        return jsonify(dashboard_schema.dump(dashboard)), 200
    except (NotFound, Conflict, BadRequest, InternalServerError) as e:
        return jsonify({"msg": e.description, "code": e.code}), e.code
    except Exception as e:
        return jsonify({"msg": str(e), "code": 500}), 500

@api_bp.route('/dashboards/<int:dashboard_id>', methods=['DELETE'])
@jwt_required()
@role_required('editor')
@limiter.limit("5 per hour", methods=['DELETE'])
def delete_dashboard(dashboard_id):
    user_id = get_jwt_identity()
    try:
        result = DashboardService.delete_dashboard(dashboard_id, user_id)
        cache.delete_memoized(get_dashboards)
        cache.delete_memoized(get_dashboard, dashboard_id)
        cache.delete_memoized(get_public_dashboard, dashboard_id)
        return jsonify(result), 200
    except (NotFound, InternalServerError) as e:
        return jsonify({"msg": e.description, "code": e.code}), e.code
    except Exception as e:
        return jsonify({"msg": str(e), "code": 500}), 500

```