import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger(__name__)

def custom_exception_handler(exc, context):
    """
    Custom exception handler for DRF to log errors and return standardized responses.
    """
    # Call DRF's default exception handler first, to get the standard error response.
    response = exception_handler(exc, context)

    # Log the exception
    logger.error(f"DRF Exception: {exc}", exc_info=True, extra={'request': context['request']})

    if response is not None:
        # For validation errors, DRF typically returns 400 with details.
        # We can add a 'code' and 'message' for consistency.
        if response.status_code == status.HTTP_400_BAD_REQUEST:
            response.data = {
                'code': 'invalid_input',
                'message': 'One or more fields failed validation.',
                'errors': response.data
            }
        elif response.status_code == status.HTTP_401_UNAUTHORIZED:
            response.data = {
                'code': 'authentication_failed',
                'message': 'Authentication credentials were not provided or are invalid.',
                'errors': response.data if response.data else 'Invalid token or credentials.'
            }
        elif response.status_code == status.HTTP_403_FORBIDDEN:
            response.data = {
                'code': 'permission_denied',
                'message': 'You do not have permission to perform this action.',
                'errors': response.data if response.data else 'Permission denied.'
            }
        elif response.status_code == status.HTTP_404_NOT_FOUND:
            response.data = {
                'code': 'not_found',
                'message': 'The requested resource was not found.',
                'errors': response.data if response.data else 'Resource not found.'
            }
        elif response.status_code >= 500:
            response.data = {
                'code': 'server_error',
                'message': 'An unexpected error occurred on the server.',
                'errors': response.data if response.data else 'Internal server error.'
            }
        return response

    # If DRF's handler didn't produce a response (e.g., a non-HTTP exception),
    # construct a generic 500 error response.
    return Response(
        {'code': 'server_error', 'message': 'An unexpected server error occurred.', 'errors': str(exc)},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR
    )
```

### `core/views.py`
```python