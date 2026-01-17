from django.db import models


class Donation(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        SUCCEEDED = 'succeeded', 'Succeeded'
        FAILED = 'failed', 'Failed'
        REFUNDED = 'refunded', 'Refunded'

    event = models.ForeignKey('events.Event', on_delete=models.CASCADE, related_name='donations')
    charity = models.ForeignKey('charities.Charity', on_delete=models.CASCADE, related_name='donations')
    donor_name = models.CharField(max_length=200)
    donor_email = models.EmailField()
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='EUR')
    message = models.TextField(blank=True)
    is_anonymous = models.BooleanField(default=False)
    stripe_session_id = models.CharField(max_length=200, blank=True)
    stripe_payment_intent = models.CharField(max_length=200, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['event', 'status']),
            models.Index(fields=['charity', 'status']),
            models.Index(fields=['status']),
            models.Index(fields=['stripe_session_id']),
            models.Index(fields=['stripe_payment_intent']),
            models.Index(fields=['donor_email']),
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        return f"{self.donor_name} - €{self.amount} to {self.charity.name}"
