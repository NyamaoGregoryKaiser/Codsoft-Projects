```python
from fastapi import HTTPException, status
from typing import Optional

class CustomException(HTTPException):
    def __init__(
        self,
        status_code: int,
        message: str,
        name: str = "CustomError",
        headers: Optional[dict[str, Any]] = None,
    ):
        super().__init__(status_code=status_code, detail=message, headers=headers)
        self.name = name
        self.message = message

# Example usage/derived exceptions (optional, but good for clarity)
class UserNotFoundException(CustomException):
    def __init__(self, message: str = "User not found"):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, message=message, name="UserNotFound")

class UnauthorizedException(CustomException):
    def __init__(self, message: str = "Not authorized"):
        super().__init__(status_code=status.HTTP_401_UNAUTHORIZED, message=message, name="Unauthorized")

class ForbiddenException(CustomException):
    def __init__(self, message: str = "Forbidden"):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, message=message, name="Forbidden")

class BadRequestException(CustomException):
    def __init__(self, message: str = "Bad Request"):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, message=message, name="BadRequest")

```