from django.db import models
from django.contrib.auth.models import User


class Event(models.Model):
    class EventType(models.TextChoices):
        WEDDING = 'wedding', 'Wedding'
        CHRISTENING = 'christening', 'Christening'
        BIRTHDAY = 'birthday', 'Birthday'
        MEMORIAL = 'memorial', 'Memorial'

    class Status(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        ACTIVE = 'active', 'Active'
        CLOSED = 'closed', 'Closed'

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='events')
    slug = models.SlugField(unique=True, max_length=100)
    event_type = models.CharField(max_length=20, choices=EventType.choices)
    title = models.CharField(max_length=200)
    story = models.TextField(blank=True)
    cover_photo = models.URLField(blank=True)
    event_date = models.DateField(null=True, blank=True)
    location = models.CharField(max_length=200, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    goal_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    is_public = models.BooleanField(default=False, help_text='Show in public examples')
    charities = models.ManyToManyField('charities.Charity', through='EventCharity')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['status']),
            models.Index(fields=['user', 'status']),
            models.Index(fields=['event_type', 'status']),
            models.Index(fields=['is_public', 'status']),
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        return self.title

    def total_raised(self):
        return self.donations.filter(
            status='succeeded'
        ).aggregate(total=models.Sum('amount'))['total'] or 0

    def donor_count(self):
        return self.donations.filter(
            status='succeeded'
        ).values('donor_email').distinct().count()


class EventCharity(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='event_charities')
    charity = models.ForeignKey('charities.Charity', on_delete=models.CASCADE, related_name='event_charities')
    display_order = models.PositiveIntegerField(default=0)
    custom_message = models.TextField(blank=True, help_text="Host's note about why this charity")

    class Meta:
        ordering = ['display_order']
        unique_together = ['event', 'charity']
        verbose_name = 'Event Charity'
        verbose_name_plural = 'Event Charities'

    def __str__(self):
        return f"{self.event.title} - {self.charity.name}"
