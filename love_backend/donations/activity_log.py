"""
AWS DynamoDB Activity Log for Donations.

Stores an append-only log of donation events in DynamoDB.
This demonstrates using the RIGHT database for the RIGHT workload:
- PostgreSQL (RDS): Relational data with joins (events, charities, users)
- DynamoDB: High-throughput, append-only event log (no joins needed)

AWS Services practiced:
- DynamoDB (fully managed NoSQL database)

Exam concepts:
- DynamoDB is a key-value and document database
- It's serverless - no instances to manage, auto-scales
- You pay for read/write capacity units (or use on-demand pricing)
- Data is stored across 3 AZs automatically (high availability)
- Single-digit millisecond performance at any scale
- Use cases: gaming leaderboards, IoT data, session stores, audit logs
- DynamoDB is NOT a replacement for relational databases
- It's best for known access patterns with simple queries

Table design:
- Partition Key: event_id (groups all activity for an event)
- Sort Key: timestamp (orders activity chronologically)
- This lets us efficiently query: "all activity for event X, sorted by time"
"""

import logging
from datetime import datetime, timezone
from decimal import Decimal

import boto3
from botocore.exceptions import ClientError
from django.conf import settings

logger = logging.getLogger(__name__)

_dynamodb_table = None


def get_activity_table():
    """Get or create a cached DynamoDB table resource."""
    global _dynamodb_table
    if _dynamodb_table is None:
        table_name = getattr(settings, 'AWS_DYNAMODB_ACTIVITY_TABLE', '')
        if not table_name:
            return None

        dynamodb = boto3.resource(
            'dynamodb',
            region_name=settings.AWS_REGION,
        )
        _dynamodb_table = dynamodb.Table(table_name)
    return _dynamodb_table


def log_activity(event_id, action, details=None):
    """
    Log a donation activity event to DynamoDB.

    Args:
        event_id: The event ID (partition key)
        action: What happened (e.g., 'donation_created', 'donation_succeeded')
        details: Optional dict with extra info (donor name, amount, etc.)
    """
    table = get_activity_table()
    if table is None:
        logger.debug("DynamoDB activity table not configured, skipping")
        return False

    now = datetime.now(timezone.utc)
    item = {
        'event_id': str(event_id),
        'timestamp': now.isoformat(),
        'action': action,
        'year_month': now.strftime('%Y-%m'),  # For GSI queries by month
    }

    if details:
        # DynamoDB doesn't support float, convert to Decimal
        cleaned = {}
        for k, v in details.items():
            if isinstance(v, float):
                cleaned[k] = Decimal(str(v))
            elif v is not None:
                cleaned[k] = str(v) if not isinstance(v, (str, int, bool, Decimal)) else v
        item['details'] = cleaned

    try:
        table.put_item(Item=item)
        logger.info(f"Logged activity: {action} for event {event_id}")
        return True
    except ClientError as e:
        logger.error(f"Failed to log activity to DynamoDB: {e}")
        return False


def get_event_activity(event_id, limit=50):
    """
    Retrieve the activity log for an event from DynamoDB.

    Uses a query (not scan) because we know the partition key.
    This is efficient - DynamoDB fetches only the data for this event.

    Args:
        event_id: The event ID to query
        limit: Max number of items to return

    Returns:
        List of activity items, sorted by timestamp descending
    """
    table = get_activity_table()
    if table is None:
        return []

    try:
        from boto3.dynamodb.conditions import Key

        response = table.query(
            KeyConditionExpression=Key('event_id').eq(str(event_id)),
            ScanIndexForward=False,  # Newest first
            Limit=limit,
        )
        return response.get('Items', [])
    except ClientError as e:
        logger.error(f"Failed to query activity from DynamoDB: {e}")
        return []
