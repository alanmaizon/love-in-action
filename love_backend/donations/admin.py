from django.contrib import admin
from .models import Donation


@admin.register(Donation)
class DonationAdmin(admin.ModelAdmin):
    list_display = ['donor_name', 'amount', 'charity', 'event', 'status', 'created_at']
    list_filter = ['status', 'charity', 'event__event_type']
    search_fields = ['donor_name', 'donor_email', 'message']
    date_hierarchy = 'created_at'
    readonly_fields = ['stripe_session_id', 'stripe_payment_intent', 'created_at', 'updated_at']
    autocomplete_fields = ['event', 'charity']

    fieldsets = (
        ('Donor Info', {
            'fields': ('donor_name', 'donor_email', 'is_anonymous')
        }),
        ('Donation Details', {
            'fields': ('event', 'charity', 'amount', 'currency', 'message')
        }),
        ('Status', {
            'fields': ('status',)
        }),
        ('Stripe', {
            'fields': ('stripe_session_id', 'stripe_payment_intent'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
