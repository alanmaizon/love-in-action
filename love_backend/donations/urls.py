from django.urls import path
from .views import create_donation_session, stripe_webhook

urlpatterns = [
    path('create-session/', create_donation_session, name='create-donation-session'),
]

# Webhook URL (to be included at project level with csrf exemption)
webhook_urlpatterns = [
    path('stripe/', stripe_webhook, name='stripe-webhook'),
]
