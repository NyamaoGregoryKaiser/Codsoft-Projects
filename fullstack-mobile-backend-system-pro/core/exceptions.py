import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger('app_logger')

def custom_exception_handler(exc, context):
    """
    Custom exception handler for Django REST Framework.
    Logs errors and returns a standardized error response.
    """
    # Call REST framework's default exception handler first,
    # to get the standard error response.
    response = exception_handler(exc, context)

    # Log the exception
    request = context.get('request')
    error_message = f"Exception: {exc} for request {request.method} {request.path}"
    logger.error(error_message, exc_info=True)

    # Customize the response for specific exceptions
    if response is not None:
        # Example: Customize 404 Not Found
        if response.status_code == status.HTTP_404_NOT_FOUND:
            response.data['detail'] = 'The requested resource was not found.'
        elif response.status_code == status.HTTP_401_UNAUTHORIZED:
            response.data['detail'] = 'Authentication credentials were not provided or are invalid.'
        elif response.status_code == status.HTTP_403_FORBIDDEN:
            response.data['detail'] = 'You do not have permission to perform this action.'
        elif response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED:
            response.data['detail'] = 'Method not allowed for this endpoint.'
        elif response.status_code >= 500:
            response.data = {'detail': 'An unexpected server error occurred.'}
            if not response.data.get('code'): # Add a generic error code if not present
                response.data['code'] = 'server_error'
            # In production, avoid sending detailed exception info to clients for 5xx errors.
            if not request.user.is_staff and not request.user.is_superuser:
                 response.data.pop('detail', None) # Remove detail for non-staff in production
                 response.data['detail'] = 'An internal server error occurred.'

    else:
        # If no standard DRF response was generated, it's likely an unhandled exception.
        # Create a generic 500 response.
        response = Response(
            {'detail': 'An unexpected error occurred.', 'code': 'unhandled_error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    return response
--- END FILE ---

---