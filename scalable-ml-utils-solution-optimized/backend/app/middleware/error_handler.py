```python
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

from backend.app.core.exceptions import (
    UnauthorizedException, ForbiddenException, NotFoundException,
    BadRequestException, InternalServerError
)
from backend.app.core.logging_config import logger

class ErrorHandlingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        try:
            response = await call_next(request)
            return response
        except UnauthorizedException as exc:
            logger.warning(f"Unauthorized access: {exc.detail}")
            return JSONResponse(
                status_code=exc.status_code,
                content={"detail": exc.detail, "error_type": "Unauthorized"},
                headers=exc.headers
            )
        except ForbiddenException as exc:
            logger.warning(f"Forbidden access: {exc.detail}")
            return JSONResponse(
                status_code=exc.status_code,
                content={"detail": exc.detail, "error_type": "Forbidden"}
            )
        except NotFoundException as exc:
            logger.info(f"Resource not found: {exc.detail}")
            return JSONResponse(
                status_code=exc.status_code,
                content={"detail": exc.detail, "error_type": "NotFound"}
            )
        except BadRequestException as exc:
            logger.error(f"Bad request: {exc.detail}")
            return JSONResponse(
                status_code=exc.status_code,
                content={"detail": exc.detail, "error_type": "BadRequest"}
            )
        except RequestValidationError as exc:
            # Handle Pydantic validation errors specifically
            logger.error(f"Validation Error: {exc.errors()} for URL: {request.url}")
            return JSONResponse(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                content={"detail": exc.errors(), "error_type": "ValidationError"}
            )
        except InternalServerError as exc:
            logger.exception(f"Internal server error: {exc.detail}")
            return JSONResponse(
                status_code=exc.status_code,
                content={"detail": exc.detail, "error_type": "InternalServerError"}
            )
        except Exception as exc:
            # Catch all other unexpected errors
            logger.exception(f"Unhandled exception: {exc}")
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"detail": "An unexpected error occurred", "error_type": "UnhandledException"}
            )

```