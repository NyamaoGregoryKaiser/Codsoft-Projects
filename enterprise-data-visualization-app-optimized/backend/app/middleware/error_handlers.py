```python
from flask import jsonify, current_app
from werkzeug.exceptions import HTTPException
import logging

class APIError(HTTPException):
    """Custom exception for API errors."""
    code = 500
    description = "An unknown error occurred."

    def __init__(self, description=None, code=None, payload=None):
        if description:
            self.description = description
        if code:
            self.code = code
        self.payload = payload
        super().__init__(description=self.description)

    def to_dict(self):
        rv = dict(self.payload or ())
        rv['message'] = self.description
        rv['status'] = self.code
        return rv

def register_error_handlers(app):
    """
    Registers global error handlers for the Flask application.
    """

    @app.errorhandler(HTTPException)
    def handle_http_exception(e):
        """Handle HTTP exceptions (e.g., 404, 400, 500)."""
        response = e.get_response()
        response.data = jsonify({
            "status": e.code,
            "message": e.description
        }).data
        response.content_type = "application/json"
        current_app.logger.warning(f"HTTP Exception: {e.code} - {e.description}")
        return response

    @app.errorhandler(APIError)
    def handle_api_error(error):
        """Handle custom API errors."""
        response = jsonify(error.to_dict())
        response.status_code = error.code
        current_app.logger.warning(f"API Error: {error.code} - {error.description} - Payload: {error.payload}")
        return response

    @app.errorhandler(Exception)
    def handle_unexpected_exception(e):
        """Handle all other unexpected exceptions."""
        current_app.logger.exception(f"An unhandled exception occurred: {e}")
        response = jsonify({
            "status": 500,
            "message": "An unexpected error occurred. Please try again later.",
            "error_details": str(e) if app.debug else "Internal Server Error"
        })
        response.status_code = 500
        return response

    # Handle SQLAlchemy errors (e.g., integrity errors)
    @app.errorhandler(500) # Can be more specific with custom exception for SQLAlchemy
    def handle_db_error(e):
        if hasattr(e, 'orig') and hasattr(e.orig, 'pgcode'): # PostgreSQL specific
            if e.orig.pgcode == '23505': # unique_violation
                current_app.logger.warning(f"Database Integrity Error (Unique Violation): {e}")
                return jsonify({"status": 409, "message": "A resource with this identifier already exists."}), 409
            # Add more specific database error codes as needed
        current_app.logger.error(f"Database error encountered: {e}")
        return handle_unexpected_exception(e) # Fallback to generic handler for now

```