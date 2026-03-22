from fastapi import status


class APIException(Exception):
    def __init__(
        self,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail: str = "An unexpected error occurred.",
    ):
        self.status_code = status_code
        self.detail = detail
        super().__init__(self.detail)


class NotFoundException(APIException):
    def __init__(self, detail: str = "Resource not found."):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail=detail)


class ConflictException(APIException):
    def __init__(self, detail: str = "Resource conflict."):
        super().__init__(status_code=status.HTTP_409_CONFLICT, detail=detail)


class UnauthorizedException(APIException):
    def __init__(self, detail: str = "Not authenticated."):
        super().__init__(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail)


class ForbiddenException(APIException):
    def __init__(self, detail: str = "Not authorized to perform this action."):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail)


class BadRequestException(APIException):
    def __init__(self, detail: str = "Bad request."):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)
```