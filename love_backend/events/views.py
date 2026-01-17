from rest_framework import viewsets, generics, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly, AllowAny
from django.shortcuts import get_object_or_404
from .models import Event
from .serializers import EventSerializer, EventListSerializer, EventCreateSerializer
from donations.serializers import DonationListSerializer


class PublicEventView(generics.RetrieveAPIView):
    """
    Public API for viewing a single event by slug.
    No authentication required.
    """
    queryset = Event.objects.filter(status='active')
    serializer_class = EventSerializer
    lookup_field = 'slug'
    permission_classes = [AllowAny]


class DashboardEventViewSet(viewsets.ModelViewSet):
    """
    Dashboard API for managing user's events.
    Requires authentication.

    list: Get all events owned by current user
    create: Create a new event
    retrieve: Get a single event by ID
    update: Update an event
    destroy: Delete an event
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Event.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.action == 'list':
            return EventListSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return EventCreateSerializer
        return EventSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['get'])
    def donations(self, request, pk=None):
        """Get all donations for this event"""
        event = self.get_object()
        donations = event.donations.all()
        serializer = DonationListSerializer(donations, many=True)
        return Response(serializer.data)
