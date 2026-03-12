from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)

def custom_exception_handler(exc, context):
    # Call DRF's default exception handler first,
    # to get the standard error response.
    response = exception_handler(exc, context)

    # Log the exception for debugging
    logger.exception(f"Unhandled exception: {exc} in {context['view'].__class__.__name__}")

    if response is not None:
        # Customize structure for DRF validation errors
        if response.status_code == 400 and isinstance(response.data, dict):
            # Example: {"field_name": ["Error message."]}
            # Convert to a more generic "errors" list if preferred
            error_list = []
            for field, messages in response.data.items():
                if isinstance(messages, list):
                    for message in messages:
                        error_list.append(f"{field}: {message}")
                else:
                    error_list.append(f"{field}: {messages}")
            response.data = {'errors': error_list, 'detail': 'Validation error.'}

        # Add a custom error message for other known DRF exceptions
        if response.status_code == 403:
            response.data = {'detail': 'You do not have permission to perform this action.', 'errors': []}
        elif response.status_code == 404:
            response.data = {'detail': 'The requested resource was not found.', 'errors': []}
        elif response.status_code == 401:
            response.data = {'detail': 'Authentication credentials were not provided or are invalid.', 'errors': []}
        elif response.status_code == 405:
            response.data = {'detail': 'Method not allowed.', 'errors': []}

        return response

    # For unexpected errors (e.g., 500 Internal Server Error)
    return Response(
        {'detail': 'An unexpected error occurred.', 'errors': [str(exc)]},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR
    )

```

#### `backend/requirements.txt`

```