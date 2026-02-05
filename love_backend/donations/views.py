import logging
import stripe
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponse
from django.core.cache import cache
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from events.models import Event
from charities.models import Charity
from .models import Donation
from .serializers import CreateDonationSessionSerializer

logger = logging.getLogger(__name__)

stripe.api_key = settings.STRIPE_SECRET_KEY


class DonationRateThrottle(AnonRateThrottle):
    """Custom rate throttle for donation endpoint."""
    rate = '10/minute'


@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([DonationRateThrottle])
def create_donation_session(request):
    """
    Create a Stripe Checkout session for a donation.

    POST /api/donations/create-session/
    {
        "event_slug": "welcome-baby-maizon",
        "charity_id": 1,
        "amount": 50.00,
        "donor_name": "John Doe",
        "donor_email": "john@example.com",
        "message": "Congratulations!",
        "is_anonymous": false
    }
    """
    serializer = CreateDonationSessionSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    data = serializer.validated_data

    try:
        event = Event.objects.select_related('user').get(
            slug=data['event_slug'],
            status='active'
        )
    except Event.DoesNotExist:
        return Response({'error': 'Event not found'}, status=status.HTTP_404_NOT_FOUND)

    try:
        charity = Charity.objects.get(id=data['charity_id'], is_active=True)
    except Charity.DoesNotExist:
        return Response({'error': 'Charity not found'}, status=status.HTTP_404_NOT_FOUND)

    # Verify charity is linked to this event
    if not event.charities.filter(id=charity.id).exists():
        return Response(
            {'error': 'This charity is not available for this event'},
            status=status.HTTP_400_BAD_REQUEST
        )

    amount_cents = int(float(data['amount']) * 100)

    # Validate amount
    if amount_cents < 100:  # Minimum €1
        return Response(
            {'error': 'Minimum donation amount is €1'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if amount_cents > 10000000:  # Maximum €100,000
        return Response(
            {'error': 'Maximum donation amount is €100,000'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Create pending donation record
    donation = Donation.objects.create(
        event=event,
        charity=charity,
        donor_name=data.get('donor_name', 'Anonymous'),
        donor_email=data.get('donor_email', ''),
        amount=data['amount'],
        message=data.get('message', ''),
        is_anonymous=data.get('is_anonymous', False),
        status='pending'
    )

    logger.info(f"Created pending donation {donation.id} for event {event.slug}")

    # Log to DynamoDB activity log
    from .activity_log import log_activity
    log_activity(event.id, 'donation_created', {
        'donation_id': donation.id,
        'charity': charity.name,
        'amount': float(data['amount']),
        'donor': data.get('donor_name', 'Anonymous'),
    })

    try:
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'eur',
                    'product_data': {
                        'name': f'Donation to {charity.name}',
                        'description': f'Via {event.title}',
                    },
                    'unit_amount': amount_cents,
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=f'{settings.FRONTEND_URL}/donate/{event.slug}/success?session_id={{CHECKOUT_SESSION_ID}}',
            cancel_url=f'{settings.FRONTEND_URL}/event/{event.slug}',
            customer_email=data.get('donor_email') or None,
            metadata={
                'donation_id': str(donation.id),
                'event_id': str(event.id),
                'charity_id': str(charity.id),
            },
            expires_at=int((donation.created_at.timestamp()) + 1800),  # 30 min expiry
        )

        donation.stripe_session_id = session.id
        donation.save(update_fields=['stripe_session_id'])

        logger.info(f"Created Stripe session {session.id} for donation {donation.id}")

        return Response({
            'checkout_url': session.url,
            'session_id': session.id
        })

    except stripe.error.StripeError as e:
        donation.status = 'failed'
        donation.save(update_fields=['status'])
        logger.error(f"Stripe error for donation {donation.id}: {e}")
        return Response({'error': 'Payment service error. Please try again.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def stripe_webhook(request):
    """
    Handle Stripe webhook events.

    POST /api/webhooks/stripe/
    """
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')

    if not sig_header:
        logger.warning("Webhook received without signature header")
        return HttpResponse(status=400)

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError as e:
        logger.error(f"Invalid webhook payload: {e}")
        return HttpResponse(status=400)
    except stripe.error.SignatureVerificationError as e:
        logger.error(f"Invalid webhook signature: {e}")
        return HttpResponse(status=400)

    logger.info(f"Received Stripe webhook: {event['type']}")

    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        donation_id = session['metadata'].get('donation_id')

        if donation_id:
            try:
                donation = Donation.objects.select_related('event', 'charity').get(id=donation_id)

                # Prevent duplicate processing
                if donation.status == 'succeeded':
                    logger.info(f"Donation {donation_id} already processed, skipping")
                    return HttpResponse(status=200)

                donation.status = 'succeeded'
                donation.stripe_payment_intent = session.get('payment_intent', '')
                donation.save(update_fields=['status', 'stripe_payment_intent', 'updated_at'])

                logger.info(f"Donation {donation_id} marked as succeeded")

                # Invalidate event cache
                cache.delete(f'event_{donation.event.slug}')

                # Publish to SQS for async email processing (Lambda)
                from .sqs_publisher import publish_donation_notification
                publish_donation_notification(donation_id, 'donation_succeeded')

                # Log to DynamoDB activity log
                from .activity_log import log_activity
                log_activity(donation.event_id, 'donation_succeeded', {
                    'donation_id': donation_id,
                    'amount': float(donation.amount),
                    'charity': donation.charity.name,
                })

            except Donation.DoesNotExist:
                logger.error(f"Donation {donation_id} not found")

    elif event['type'] == 'checkout.session.expired':
        session = event['data']['object']
        donation_id = session['metadata'].get('donation_id')

        if donation_id:
            updated = Donation.objects.filter(
                id=donation_id,
                status='pending'
            ).update(status='failed')

            if updated:
                logger.info(f"Donation {donation_id} marked as failed (expired)")

    elif event['type'] == 'charge.refunded':
        # Handle refunds
        charge = event['data']['object']
        payment_intent = charge.get('payment_intent')

        if payment_intent:
            updated = Donation.objects.filter(
                stripe_payment_intent=payment_intent
            ).update(status='refunded')

            if updated:
                logger.info(f"Donation with payment_intent {payment_intent} marked as refunded")

    return HttpResponse(status=200)
