```python
import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger('apps')

def custom_exception_handler(exc, context):
    """
    Custom exception handler for Django REST Framework that adds logging.
    """
    # Call DRF's default exception handler first,
    # to get the standard error response.
    response = exception_handler(exc, context)

    # Log the exception
    request = context.get('request')
    if request:
        error_message = f"Unhandled exception: {exc} for request {request.method} {request.path}"
    else:
        error_message = f"Unhandled exception: {exc}"
    logger.error(error_message, exc_info=True) # exc_info=True to include traceback

    # If DRF's handler returned a response, use it
    if response is not None:
        # Add a custom error code or modify the message if needed
        response.data['status_code'] = response.status_code
        if 'detail' in response.data:
            response.data['message'] = response.data.pop('detail')
        return response

    # If DRF's handler didn't return a response, it means it's an unhandled
    # exception not covered by DRF's default handlers (e.g., programming errors).
    # We should return a generic 500 error.
    return Response(
        {'message': 'An unexpected error occurred.', 'status_code': status.HTTP_500_INTERNAL_SERVER_ERROR},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR
    )
```