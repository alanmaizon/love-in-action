import logging
from celery import shared_task
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_donation_confirmation_email(self, donation_id):
    """
    Send confirmation email to donor after successful payment.
    Runs as a background task to not block the webhook response.
    """
    try:
        from .models import Donation
        donation = Donation.objects.select_related('event', 'charity').get(id=donation_id)

        if not donation.donor_email:
            logger.info(f"No email for donation {donation_id}, skipping confirmation")
            return

        subject = f"Thank you for your donation to {donation.charity.name}"

        # Plain text version
        message = f"""
Thank you for your generous donation!

Donation Details:
- Amount: €{donation.amount}
- Charity: {donation.charity.name}
- Event: {donation.event.title}

Your donation is making a difference. Thank you for being part of {donation.event.title}.

With gratitude,
Love In Action
"""

        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[donation.donor_email],
            fail_silently=False,
        )

        logger.info(f"Sent confirmation email for donation {donation_id} to {donation.donor_email}")

    except Exception as exc:
        logger.error(f"Failed to send confirmation email for donation {donation_id}: {exc}")
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_host_notification_email(self, donation_id):
    """
    Notify event host about a new donation.
    """
    try:
        from .models import Donation
        donation = Donation.objects.select_related('event', 'event__user', 'charity').get(id=donation_id)

        host = donation.event.user
        if not host.email:
            logger.info(f"No email for host of event {donation.event.id}, skipping notification")
            return

        donor_display = "Anonymous" if donation.is_anonymous else donation.donor_name

        subject = f"New donation for {donation.event.title}!"

        message = f"""
Great news! You've received a new donation.

Donation Details:
- Donor: {donor_display}
- Amount: €{donation.amount}
- Charity: {donation.charity.name}
{f'- Message: {donation.message}' if donation.message else ''}

Total raised so far: €{donation.event.total_raised()}

View all donations in your dashboard.

Love In Action
"""

        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[host.email],
            fail_silently=False,
        )

        logger.info(f"Sent host notification for donation {donation_id} to {host.email}")

    except Exception as exc:
        logger.error(f"Failed to send host notification for donation {donation_id}: {exc}")
        raise self.retry(exc=exc)
