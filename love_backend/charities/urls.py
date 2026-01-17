from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CharityViewSet

router = DefaultRouter()
router.register(r'', CharityViewSet, basename='charity')

urlpatterns = [
    path('', include(router.urls)),
]
