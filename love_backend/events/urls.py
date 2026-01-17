from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PublicEventView, DashboardEventViewSet

router = DefaultRouter()
router.register(r'', DashboardEventViewSet, basename='dashboard-event')

urlpatterns = [
    # Public event view by slug
    path('<slug:slug>/', PublicEventView.as_view(), name='public-event'),
]

# Dashboard URLs (to be included separately)
dashboard_urlpatterns = [
    path('', include(router.urls)),
]
