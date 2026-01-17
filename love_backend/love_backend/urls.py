from django.contrib import admin
from django.urls import path, include
from django.middleware.csrf import get_token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.contrib.auth import authenticate, login, logout

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

    # Public APIs
    path('api/events/', include('events.urls')),
    path('api/charities/', include('charities.urls')),
    path('api/donations/', include('donations.urls')),

    # Dashboard APIs (authenticated)
    path('api/dashboard/events/', include(events_dashboard_urls)),

    # Webhooks (CSRF exempt)
    path('api/webhooks/', include(webhook_urlpatterns)),
]
