class ApiError(Exception):
    """Base class for custom API errors."""
    def __init__(self, message, status_code=500, payload=None):
        super().__init__(self)
        self.message = message
        self.status_code = status_code
        self.payload = payload

    def to_dict(self):
        rv = dict(self.payload or ())
        rv['message'] = self.message
        return rv

class BadRequestError(ApiError):
    def __init__(self, message="Bad Request", payload=None):
        super().__init__(message, 400, payload)

class UnauthorizedError(ApiError):
    def __init__(self, message="Unauthorized", payload=None):
        super().__init__(message, 401, payload)

class ForbiddenError(ApiError):
    def __init__(self, message="Forbidden", payload=None):
        super().__init__(message, 403, payload)

class NotFoundError(ApiError):
    def __init__(self, message="Resource not found", payload=None):
        super().__init__(message, 404, payload)

class ConflictError(ApiError):
    def __init__(self, message="Resource conflict", payload=None):
        super().__init__(message, 409, payload)

class ValidationError(ApiError):
    def __init__(self, message="Validation failed", errors=None, payload=None):
        super().__init__(message, 422, payload)
        self.errors = errors if errors is not None else {}

    def to_dict(self):
        rv = super().to_dict()
        rv['errors'] = self.errors
        return rv
```