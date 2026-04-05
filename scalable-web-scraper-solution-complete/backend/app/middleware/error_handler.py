from fastapi import Request, Response, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from pydantic import ValidationError
from loguru import logger

class ErrorHandlingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        try:
            response = await call_next(request)
            return response
        except HTTPException as http_exc:
            logger.warning(f"HTTPException: {http_exc.status_code} - {http_exc.detail} for {request.method} {request.url}")
            return JSONResponse(
                status_code=http_exc.status_code,
                content={"detail": http_exc.detail},
                headers=http_exc.headers
            )
        except ValidationError as validation_exc:
            logger.error(f"ValidationError: {validation_exc.errors()} for {request.method} {request.url}")
            return JSONResponse(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                content={"detail": validation_exc.errors()}
            )
        except Exception as e:
            logger.exception(f"Unhandled exception: {e} for {request.method} {request.url}")
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"detail": "An internal server error occurred."}
            )

# Custom exception for business logic errors
class CustomBusinessException(HTTPException):
    def __init__(self, status_code: int = status.HTTP_400_BAD_REQUEST, detail: Any = "Bad Request"):
        super().__init__(status_code=status_code, detail=detail)

```