import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from django.core.exceptions import ValidationError
from django.http import Http404

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Custom exception handler that provides consistent error responses
    and logs errors appropriately.
    """
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)

    # Get request info for logging
    request = context.get('request')
    view = context.get('view')

    if response is not None:
        # Customize the response data
        custom_response_data = {
            'error': True,
            'message': get_error_message(exc),
            'status_code': response.status_code,
        }

        # Add field-level errors for validation errors
        if hasattr(response, 'data') and isinstance(response.data, dict):
            if 'detail' not in response.data:
                custom_response_data['errors'] = response.data

        response.data = custom_response_data

        # Log based on severity
        if response.status_code >= 500:
            logger.error(
                f"Server error: {exc} | View: {view.__class__.__name__ if view else 'Unknown'} | "
                f"Path: {request.path if request else 'Unknown'}",
                exc_info=True
            )
        elif response.status_code >= 400:
            logger.warning(
                f"Client error: {exc} | View: {view.__class__.__name__ if view else 'Unknown'} | "
                f"Path: {request.path if request else 'Unknown'}"
            )
    else:
        # Handle unexpected exceptions
        logger.exception(
            f"Unhandled exception: {exc} | View: {view.__class__.__name__ if view else 'Unknown'} | "
            f"Path: {request.path if request else 'Unknown'}"
        )

        response = Response(
            {
                'error': True,
                'message': 'An unexpected error occurred. Please try again later.',
                'status_code': 500,
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    return response


def get_error_message(exc):
    """Extract a user-friendly error message from an exception."""
    if isinstance(exc, Http404):
        return 'Resource not found.'

    if hasattr(exc, 'detail'):
        detail = exc.detail
        if isinstance(detail, str):
            return detail
        elif isinstance(detail, list):
            return detail[0] if detail else 'Validation error.'
        elif isinstance(detail, dict):
            # Get first error message
            for key, value in detail.items():
                if isinstance(value, list):
                    return f"{key}: {value[0]}"
                return f"{key}: {value}"

    return str(exc) if str(exc) else 'An error occurred.'
