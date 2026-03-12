from flask import jsonify, current_app

class InvalidUsage(Exception):
    status_code = 400

    def __init__(self, message, status_code=None, payload=None):
        Exception.__init__(self)
        self.message = message
        if status_code is not None:
            self.status_code = status_code
        self.payload = payload

    def to_dict(self):
        rv = dict(self.payload or ())
        rv['message'] = self.message
        return rv

class APIError(InvalidUsage):
    """Custom API exception for structured error responses."""
    def __init__(self, message, status_code=400, payload=None):
        super().__init__(message, status_code, payload)
        current_app.logger.warning(f"API Error: {message} (Status: {status_code})")

def handle_api_error(error):
    response = jsonify(error.to_dict())
    response.status_code = error.status_code
    return response

def handle_validation_error(err):
    """Handles webargs validation errors."""
    messages = err.data.get('messages', {})
    current_app.logger.warning(f"Validation Error: {messages}")
    return jsonify(message="Validation Error", errors=messages), 422
```