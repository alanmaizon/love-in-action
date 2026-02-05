import uuid
import logging

import boto3
from django.conf import settings as django_settings
from rest_framework import viewsets, generics, status
from rest_framework.decorators import api_view, action, permission_classes as perm_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly, AllowAny
from django.shortcuts import get_object_or_404
from .models import Event
from .serializers import EventSerializer, EventListSerializer, EventCreateSerializer
from donations.serializers import DonationListSerializer

logger = logging.getLogger(__name__)


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

    @action(detail=True, methods=['get'])
    def activity(self, request, pk=None):
        """
        Get the activity log for this event from DynamoDB.

        AWS Exam Note: This reads from DynamoDB (NoSQL) while the
        donations endpoint above reads from PostgreSQL (RDS/SQL).
        Using the right DB for the right workload is a key AWS concept.
        """
        event = self.get_object()
        from donations.activity_log import get_event_activity
        activities = get_event_activity(event.id)
        return Response(activities)


@api_view(['POST'])
@perm_classes([IsAuthenticated])
def presigned_upload_view(request):
    """
    Generate a presigned S3 URL for direct browser upload.

    AWS Exam Note: Presigned URLs allow the browser to upload directly
    to S3 without the file passing through our server. This:
    - Reduces server load (S3 handles the upload)
    - Reduces latency (browser talks to S3 directly)
    - Is a common serverless pattern

    POST /api/dashboard/upload/
    { "filename": "photo.jpg", "content_type": "image/jpeg" }
    """
    filename = request.data.get('filename', '')
    content_type = request.data.get('content_type', 'application/octet-stream')

    if not filename:
        return Response({'error': 'filename is required'}, status=status.HTTP_400_BAD_REQUEST)

    bucket = django_settings.AWS_S3_BUCKET_NAME
    if not bucket:
        return Response({'error': 'S3 not configured'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    # Generate a unique key to prevent overwrites
    ext = filename.rsplit('.', 1)[-1] if '.' in filename else 'bin'
    key = f'uploads/{request.user.id}/{uuid.uuid4().hex}.{ext}'

    try:
        s3_client = boto3.client(
            's3',
            region_name=django_settings.AWS_REGION,
        )

        presigned = s3_client.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': bucket,
                'Key': key,
                'ContentType': content_type,
            },
            ExpiresIn=300,  # URL valid for 5 minutes
        )

        file_url = f'https://{bucket}.s3.amazonaws.com/{key}'

        return Response({
            'upload_url': presigned,
            'file_url': file_url,
        })

    except Exception as e:
        logger.error(f"Failed to generate presigned URL: {e}")
        return Response({'error': 'Failed to generate upload URL'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
