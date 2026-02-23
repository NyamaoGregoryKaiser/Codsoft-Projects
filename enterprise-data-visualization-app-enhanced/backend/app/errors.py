```python
from flask import jsonify
from werkzeug.exceptions import HTTPException
from .extensions import jwt # Import jwt to handle JWT-specific errors

def register_error_handlers(app):
    """Registers custom error handlers for the Flask app."""

    @app.errorhandler(HTTPException)
    def handle_http_exception(e):
        """Return JSON instead of HTML for HTTP errors."""
        response = e.get_response()
        response.data = jsonify({
            "code": e.code,
            "name": e.name,
            "description": e.description,
        }).data
        response.content_type = "application/json"
        return response

    @app.errorhandler(Exception)
    def handle_exception(e):
        """Catch all other unhandled exceptions."""
        app.logger.error(f"Unhandled exception: {e}", exc_info=True)
        return jsonify({
            "code": 500,
            "name": "Internal Server Error",
            "description": "An unexpected error occurred. Please try again later.",
        }), 500

    # JWT Error handlers
    @jwt.unauthorized_loader
    def unauthorized_response(callback):
        return jsonify({"msg": "Missing Authorization Header", "code": 401}), 401

    @jwt.invalid_token_loader
    def invalid_token_response(callback):
        return jsonify({"msg": "Signature verification failed", "code": 401}), 401

    @jwt.expired_token_loader
    def expired_token_response(callback):
        return jsonify({"msg": "Token has expired", "code": 401}), 401

    @jwt.revoked_token_loader
    def revoked_token_response(callback):
        return jsonify({"msg": "Token has been revoked", "code": 401}), 401

    @jwt.needs_fresh_token_loader
    def needs_fresh_token_response(callback):
        return jsonify({"msg": "Fresh token required", "code": 401}), 401

```