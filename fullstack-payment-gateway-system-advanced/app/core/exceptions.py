```python
from fastapi import HTTPException, status

class PaymentProcessorException(HTTPException):
    def __init__(self, detail: str, status_code: int = status.HTTP_400_BAD_REQUEST):
        super().__init__(status_code=status_code, detail=detail)

class NotFoundException(PaymentProcessorException):
    def __init__(self, detail: str = "Resource not found"):
        super().__init__(detail=detail, status_code=status.HTTP_404_NOT_FOUND)

class UnauthorizedException(PaymentProcessorException):
    def __init__(self, detail: str = "Could not validate credentials"):
        super().__init__(detail=detail, status_code=status.HTTP_401_UNAUTHORIZED)

class ForbiddenException(PaymentProcessorException):
    def __init__(self, detail: str = "Not authorized to perform this action"):
        super().__init__(detail=detail, status_code=status.HTTP_403_FORBIDDEN)

class ConflictException(PaymentProcessorException):
    def __init__(self, detail: str = "Resource already exists or conflicts"):
        super().__init__(detail=detail, status_code=status.HTTP_409_CONFLICT)

class ServiceUnavailableException(PaymentProcessorException):
    def __init__(self, detail: str = "External service unavailable or timed out"):
        super().__init__(detail=detail, status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
```