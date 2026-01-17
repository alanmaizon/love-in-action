from django.db import models


class Charity(models.Model):
    class Category(models.TextChoices):
        CHILDREN = 'children', 'Children'
        HEALTH = 'health', 'Health'
        ANIMALS = 'animals', 'Animals'
        ENVIRONMENT = 'environment', 'Environment'
        INTERNATIONAL = 'international', 'International'
        HOMELESSNESS = 'homelessness', 'Homelessness'
        MENTAL_HEALTH = 'mental_health', 'Mental Health'
        OTHER = 'other', 'Other'

    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True, max_length=100)
    description = models.TextField()
    logo = models.URLField(blank=True)
    website = models.URLField()
    registration_number = models.CharField(max_length=50, blank=True, help_text='CHY number for Irish charities')
    registration_country = models.CharField(max_length=2, default='IE')
    category = models.CharField(max_length=20, choices=Category.choices, default=Category.OTHER)
    is_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    contact_email = models.EmailField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'Charities'
        ordering = ['name']
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['category', 'is_active']),
            models.Index(fields=['is_active']),
            models.Index(fields=['is_verified', 'is_active']),
        ]

    def __str__(self):
        return self.name
