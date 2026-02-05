"""
AWS SQS Publisher for Donation Events.

Publishes donation notification messages to an SQS queue,
which triggers a Lambda function to send emails.

AWS Services practiced:
- SQS (Simple Queue Service) - fully managed message queue
- Decoupling pattern: webhook -> SQS -> Lambda -> SES

Exam concepts:
- SQS is a fully managed message queue (no servers to manage)
- SQS guarantees at-least-once delivery
- Standard queues: best-effort ordering, unlimited throughput
- FIFO queues: exactly-once, guaranteed ordering (not needed here)
- Messages are retained for up to 14 days (default 4 days)
- This is the "decoupling" pattern the exam loves to ask about
"""

import json
import logging

import boto3
from django.conf import settings

logger = logging.getLogger(__name__)

_sqs_client = None


def get_sqs_client():
    """Get or create a cached SQS client."""
    global _sqs_client
    if _sqs_client is None:
        _sqs_client = boto3.client(
            'sqs',
            region_name=settings.AWS_REGION,
        )
    return _sqs_client


def publish_donation_notification(donation_id, event_type='donation_succeeded'):
    """
    Publish a donation event to the SQS queue.

    The message contains just the donation ID and event type.
    The Lambda function will fetch full details from the database.

    Args:
        donation_id: The ID of the donation
        event_type: Type of event (donation_succeeded, donation_failed, etc.)
    """
    queue_url = getattr(settings, 'AWS_SQS_DONATION_QUEUE_URL', '')

    if not queue_url:
        logger.info("SQS not configured, skipping notification publish")
        return False

    message = {
        'donation_id': str(donation_id),
        'event_type': event_type,
    }

    try:
        sqs = get_sqs_client()
        response = sqs.send_message(
            QueueUrl=queue_url,
            MessageBody=json.dumps(message),
            MessageAttributes={
                'EventType': {
                    'DataType': 'String',
                    'StringValue': event_type,
                }
            },
        )

        message_id = response.get('MessageId')
        logger.info(
            f"Published {event_type} for donation {donation_id} "
            f"to SQS (MessageId: {message_id})"
        )
        return True

    except Exception as e:
        logger.error(f"Failed to publish to SQS: {e}")
        return False
