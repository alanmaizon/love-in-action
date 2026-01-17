from rest_framework import viewsets, filters
from .models import Charity
from .serializers import CharitySerializer, CharityListSerializer


class CharityViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Public API for viewing charities.

    list: Get all active charities
    retrieve: Get a single charity by slug
    """
    queryset = Charity.objects.filter(is_active=True)
    lookup_field = 'slug'
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'description']

    def get_serializer_class(self):
        if self.action == 'list':
            return CharityListSerializer
        return CharitySerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        return queryset
