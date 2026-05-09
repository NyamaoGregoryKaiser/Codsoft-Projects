```python
from typing import Optional


class CustomException(Exception):
    def __init__(self, status_code: int, detail: str, headers: Optional[dict] = None):
        self.status_code = status_code
        self.detail = detail
        self.headers = headers


class UnauthorizedException(CustomException):
    def __init__(self, detail: str = "Not authenticated", headers: Optional[dict] = None):
        super().__init__(401, detail, headers={"WWW-Authenticate": "Bearer"})


class ForbiddenException(CustomException):
    def __init__(self, detail: str = "Not authorized to perform this action"):
        super().__init__(403, detail)


class NotFoundException(CustomException):
    def __init__(self, detail: str = "Resource not found"):
        super().__init__(404, detail)


class ValidationException(CustomException):
    def __init__(self, detail: str = "Invalid input or data"):
        super().__init__(422, detail)


class ConflictException(CustomException):
    def __init__(self, detail: str = "Resource already exists or conflicts with existing data"):
        super().__init__(409, detail)

```