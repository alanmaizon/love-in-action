from django.contrib import admin
from django.urls import path, include
from django.middleware.csrf import get_token
from django.shortcuts import redirect
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.contrib.auth import authenticate, login, logout
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter

from events.urls import dashboard_urlpatterns as events_dashboard_urls
from donations.urls import webhook_urlpatterns


@api_view(['GET'])
@permission_classes([AllowAny])
def csrf_view(request):
    """Get CSRF token - ensures the cookie is set"""
    return Response({'csrfToken': get_token(request)})


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """Session-based login"""
    username = request.data.get('username')
    password = request.data.get('password')
    user = authenticate(request, username=username, password=password)
    if user is not None:
        login(request, user)
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
        })
    return Response({'error': 'Invalid credentials'}, status=401)


@api_view(['POST'])
def logout_view(request):
    """Session-based logout"""
    logout(request)
    return Response({'message': 'Logged out successfully'})


@api_view(['GET'])
def me_view(request):
    """Get current authenticated user"""
    if request.user.is_authenticated:
        return Response({
            'id': request.user.id,
            'username': request.user.username,
            'email': request.user.email,
            'first_name': request.user.first_name,
            'last_name': request.user.last_name,
        })
    return Response({'error': 'Not authenticated'}, status=401)


@api_view(['GET'])
@permission_classes([AllowAny])
def social_providers_view(request):
    """Return available social login providers and their config"""
    providers = []

    # Check if Google is configured
    google_client_id = settings.SOCIALACCOUNT_PROVIDERS.get('google', {}).get('APP', {}).get('client_id')
    if google_client_id:
        providers.append({
            'provider': 'google',
            'name': 'Google',
            'client_id': google_client_id,
        })

    return Response({'providers': providers})


def social_callback_view(request):
    """
    Redirect from allauth after social login.
    This redirects to the frontend with auth status.
    """
    frontend_url = settings.FRONTEND_URL

    if request.user.is_authenticated:
        # Successful login - redirect to frontend dashboard
        return redirect(f'{frontend_url}/dashboard?social_login=success')
    else:
        # Failed login - redirect to frontend login with error
        return redirect(f'{frontend_url}/login?social_login=failed')


urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),

    # Health checks
    path('health/', include('health_check.urls')),

    # Auth
    path('api/auth/csrf/', csrf_view, name='csrf'),
    path('api/auth/login/', login_view, name='login'),
    path('api/auth/logout/', logout_view, name='logout'),
    path('api/auth/me/', me_view, name='me'),
    path('api/auth/social/providers/', social_providers_view, name='social-providers'),

    # Social auth (allauth)
    path('accounts/', include('allauth.urls')),
    path('social-callback', social_callback_view, name='social-callback'),

    # Public APIs
    path('api/events/', include('events.urls')),
    path('api/charities/', include('charities.urls')),
    path('api/donations/', include('donations.urls')),

    # Dashboard APIs (authenticated)
    path('api/dashboard/events/', include(events_dashboard_urls)),

    # Webhooks (CSRF exempt)
    path('api/webhooks/', include(webhook_urlpatterns)),
]
