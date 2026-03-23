from fastapi import HTTPException, status

class DetailedHTTPException(HTTPException):
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    detail = "Server Error"

    def __init__(self, detail: str = None, status_code: int = None):
        if detail:
            self.detail = detail
        if status_code:
            self.status_code = status_code
        super().__init__(status_code=self.status_code, detail=self.detail)

class EntityNotFoundException(DetailedHTTPException):
    status_code = status.HTTP_404_NOT_FOUND
    detail = "Entity not found."

    def __init__(self, entity_name: str = "Entity", entity_id: Union[str, int] = None):
        detail_msg = f"{entity_name} not found."
        if entity_id is not None:
            detail_msg = f"{entity_name} with ID '{entity_id}' not found."
        super().__init__(detail=detail_msg, status_code=self.status_code)

class UnauthorizedException(DetailedHTTPException):
    status_code = status.HTTP_401_UNAUTHORIZED
    detail = "Not authenticated"
    headers = {"WWW-Authenticate": "Bearer"}

    def __init__(self, detail: str = None):
        super().__init__(detail=detail or self.detail, status_code=self.status_code)

class ForbiddenException(DetailedHTTPException):
    status_code = status.HTTP_403_FORBIDDEN
    detail = "Not authorized to perform this action."

    def __init__(self, detail: str = None):
        super().__init__(detail=detail or self.detail, status_code=self.status_code)

class BadRequestException(DetailedHTTPException):
    status_code = status.HTTP_400_BAD_REQUEST
    detail = "Bad request."

class DuplicateEntryException(DetailedHTTPException):
    status_code = status.HTTP_409_CONFLICT
    detail = "Duplicate entry."