"""
AWS Lambda Function: Send Donation Notification Emails

Triggered by SQS messages when a donation succeeds.
Uses Amazon SES to send confirmation emails.

AWS Services practiced:
- Lambda (serverless compute - runs code without managing servers)
- SQS (event source - triggers this Lambda)
- SES (Simple Email Service - sending emails)
- CloudWatch Logs (Lambda logs here automatically)

Exam concepts:
- Lambda is serverless - you pay only for compute time used
- Lambda scales automatically (up to 1000 concurrent by default)
- Lambda has a max execution time of 15 minutes
- SQS can trigger Lambda (event source mapping)
- SES is a managed email service (not SMTP on a server)
- This is an EVENT-DRIVEN architecture pattern

Deployment:
1. Create this Lambda function in AWS Console
2. Set the SQS queue as a trigger
3. Give the Lambda role permissions for SES and database access
4. Set environment variables: DATABASE_URL, SES_FROM_EMAIL, FRONTEND_URL
"""

import json
import os
import logging

import boto3

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize SES client
ses_client = boto3.client('ses', region_name=os.environ.get('AWS_REGION', 'eu-west-1'))

FROM_EMAIL = os.environ.get('SES_FROM_EMAIL', 'noreply@loveinaction.com')
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'https://loveinaction.com')


def handler(event, context):
    """
    Lambda handler - processes SQS messages.

    The 'event' parameter contains a batch of SQS messages.
    Each message has the donation_id we need to process.

    Args:
        event: SQS event with Records[]
        context: Lambda context (request ID, remaining time, etc.)
    """
    logger.info(f"Processing {len(event.get('Records', []))} SQS messages")

    for record in event.get('Records', []):
        try:
            body = json.loads(record['body'])
            donation_id = body.get('donation_id')
            event_type = body.get('event_type', 'donation_succeeded')

            logger.info(f"Processing {event_type} for donation {donation_id}")

            if event_type == 'donation_succeeded':
                send_donor_confirmation(donation_id)
                send_host_notification(donation_id)

        except Exception as e:
            logger.error(f"Failed to process message: {e}")
            # Raising the exception causes SQS to retry the message
            raise

    return {'statusCode': 200, 'body': 'OK'}


def send_donor_confirmation(donation_id):
    """Send a thank-you email to the donor via SES."""
    # In production, you'd fetch donation details from the database.
    # For this learning exercise, we use the data from the SQS message
    # or call back to the Django API.

    # Example SES send (template):
    try:
        ses_client.send_email(
            Source=FROM_EMAIL,
            Destination={
                'ToAddresses': ['donor@example.com'],  # Would come from DB
            },
            Message={
                'Subject': {
                    'Data': f'Thank you for your donation!',
                    'Charset': 'UTF-8',
                },
                'Body': {
                    'Text': {
                        'Data': (
                            f'Thank you for your generous donation!\n\n'
                            f'Your donation is making a difference.\n\n'
                            f'With gratitude,\n'
                            f'Love In Action'
                        ),
                        'Charset': 'UTF-8',
                    },
                    'Html': {
                        'Data': (
                            f'<h2>Thank you for your generous donation!</h2>'
                            f'<p>Your donation is making a difference.</p>'
                            f'<p>With gratitude,<br>Love In Action</p>'
                        ),
                        'Charset': 'UTF-8',
                    },
                },
            },
        )
        logger.info(f"Sent donor confirmation for donation {donation_id}")
    except Exception as e:
        logger.error(f"Failed to send donor email for {donation_id}: {e}")
        raise


def send_host_notification(donation_id):
    """Notify the event host about a new donation via SES."""
    try:
        ses_client.send_email(
            Source=FROM_EMAIL,
            Destination={
                'ToAddresses': ['host@example.com'],  # Would come from DB
            },
            Message={
                'Subject': {
                    'Data': 'New donation received!',
                    'Charset': 'UTF-8',
                },
                'Body': {
                    'Text': {
                        'Data': (
                            f'Great news! You\'ve received a new donation.\n\n'
                            f'View all donations in your dashboard:\n'
                            f'{FRONTEND_URL}/dashboard\n\n'
                            f'Love In Action'
                        ),
                        'Charset': 'UTF-8',
                    },
                },
            },
        )
        logger.info(f"Sent host notification for donation {donation_id}")
    except Exception as e:
        logger.error(f"Failed to send host email for {donation_id}: {e}")
        raise
