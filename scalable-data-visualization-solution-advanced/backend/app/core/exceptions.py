```python
class CustomException(Exception):
    def __init__(self, status_code: int, message: str, name: str = "Custom Error"):
        self.status_code = status_code
        self.message = message
        self.name = name
        super().__init__(self.message)

class UnauthorizedException(CustomException):
    def __init__(self, message: str = "Authentication required or invalid credentials."):
        super().__init__(401, message, "Unauthorized")

class ForbiddenException(CustomException):
    def __init__(self, message: str = "You do not have permission to access this resource."):
        super().__init__(403, message, "Forbidden")

class NotFoundException(CustomException):
    def __init__(self, message: str = "The requested resource was not found."):
        super().__init__(404, message, "Not Found")

class BadRequestException(CustomException):
    def __init__(self, message: str = "Bad request."):
        super().__init__(400, message, "Bad Request")

class ConflictException(CustomException):
    def __init__(self, message: str = "Resource already exists."):
        super().__init__(409, message, "Conflict")
```