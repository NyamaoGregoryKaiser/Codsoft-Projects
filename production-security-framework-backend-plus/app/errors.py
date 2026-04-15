```python
from flask import jsonify, current_app
from werkzeug.exceptions import HTTPException, default_exceptions
from marshmallow import ValidationError
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

def register_error_handlers(app):
    """
    Registers custom error handlers for the Flask application.
    This provides a consistent JSON error response format.
    """

    def handle_error(e):
        """Generic error handler for HTTP exceptions."""
        code = getattr(e, 'code', 500)
        name = getattr(e, 'name', 'Internal Server Error')
        description = getattr(e, 'description', 'An unexpected error occurred.')

        if isinstance(e, HTTPException):
            current_app.logger.warning(f"HTTP Error {code}: {description}")
        else:
            current_app.logger.error(f"Unhandled exception: {e}", exc_info=True)
            code = 500
            name = "Internal Server Error"
            description = "An unexpected error occurred. Please try again later."

        response = {
            "status": code,
            "error": name,
            "message": description
        }
        return jsonify(response), code

    # Register for all default HTTP exceptions
    for ex in default_exceptions:
        app.register_error_handler(ex, handle_error)

    # Register custom error handlers
    app.register_error_handler(ValidationError, handle_validation_error)
    app.register_error_handler(IntegrityError, handle_integrity_error)
    app.register_error_handler(SQLAlchemyError, handle_database_error)
    app.register_error_handler(Exception, handle_error) # Catch all other exceptions

def handle_validation_error(e: ValidationError):
    """Error handler for Marshmallow validation errors."""
    current_app.logger.info(f"Validation error: {e.messages}")
    response = {
        "status": 400,
        "error": "Bad Request",
        "message": "Validation failed",
        "errors": e.messages # Detailed validation errors
    }
    return jsonify(response), 400

def handle_integrity_error(e: IntegrityError):
    """Error handler for SQLAlchemy IntegrityError (e.g., duplicate unique key)."""
    current_app.logger.warning(f"Database integrity error: {e.orig}")
    message = "A database constraint was violated (e.g., duplicate entry)."
    if "UniqueViolation" in str(e.orig): # Specific to PostgreSQL
        if "users_username_key" in str(e.orig):
            message = "Username already exists."
        elif "users_email_key" in str(e.orig):
            message = "Email already exists."
    
    response = {
        "status": 409, # Conflict
        "error": "Conflict",
        "message": message
    }
    return jsonify(response), 409

def handle_database_error(e: SQLAlchemyError):
    """Generic error handler for other SQLAlchemy errors."""
    current_app.logger.error(f"Database error: {e}", exc_info=True)
    response = {
        "status": 500,
        "error": "Internal Server Error",
        "message": "A database operation failed unexpectedly."
    }
    return jsonify(response), 500

class APIError(HTTPException):
    """Custom API error class for consistent responses."""
    code = 500
    description = 'An unknown API error occurred.'

    def __init__(self, message=None, code=None, payload=None):
        super().__init__()
        if code is not None:
            self.code = code
        if message is not None:
            self.description = message
        self.payload = payload

    def to_dict(self):
        rv = dict(self.payload or ())
        rv['status'] = self.code
        rv['error'] = self.name
        rv['message'] = self.description
        return rv
```