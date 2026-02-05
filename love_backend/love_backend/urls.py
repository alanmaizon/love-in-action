from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from events.urls import dashboard_urlpatterns as events_dashboard_urls
from events.views import presigned_upload_view
from donations.urls import webhook_urlpatterns


@api_view(['GET'])
@permission_classes([AllowAny])
def cognito_config_view(request):
    """
    Return Cognito configuration for the frontend.
    The frontend needs these values to initialize the Cognito SDK.

    AWS Exam Note: This is a common pattern - the backend provides
    non-secret configuration to the frontend. The User Pool ID and
    Client ID are NOT secrets (they're embedded in the frontend).
    The actual secrets (client secret, if any) stay on the server.
    """
    return Response({
        'region': settings.AWS_COGNITO_REGION,
        'userPoolId': settings.AWS_COGNITO_USER_POOL_ID,
        'clientId': settings.AWS_COGNITO_APP_CLIENT_ID,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me_view(request):
    """
    Get current authenticated user.
    Now authenticated via Cognito JWT token.
    """
    return Response({
        'id': request.user.id,
        'username': request.user.username,
        'email': request.user.email,
        'first_name': request.user.first_name,
        'last_name': request.user.last_name,
    })


urlpatterns = [
    # Admin (still uses Django session auth)
    path('admin/', admin.site.urls),

    # Health checks
    path('health/', include('health_check.urls')),

    # Auth - Cognito config + user info
    path('api/auth/cognito-config/', cognito_config_view, name='cognito-config'),
    path('api/auth/me/', me_view, name='me'),

    # Public APIs
    path('api/events/', include('events.urls')),
    path('api/charities/', include('charities.urls')),
    path('api/donations/', include('donations.urls')),

    # Dashboard APIs (authenticated via Cognito)
    path('api/dashboard/events/', include(events_dashboard_urls)),
    path('api/dashboard/upload/', presigned_upload_view, name='presigned-upload'),

    # Webhooks (CSRF exempt, validated by Stripe signature)
    path('api/webhooks/', include(webhook_urlpatterns)),
]
