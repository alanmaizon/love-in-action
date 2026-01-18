import json
from decimal import Decimal
from unittest.mock import patch, MagicMock
from django.test import TestCase, override_settings
from django.contrib.auth.models import User
from rest_framework.test import APITestCase, APIClient
from rest_framework import status

from .models import Donation
from events.models import Event, EventCharity
from charities.models import Charity


class DonationModelTest(TestCase):
    """Tests for Donation model"""

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.charity = Charity.objects.create(
            name='Test Charity',
            slug='test-charity',
            description='Test description',
            website='https://test.org',
            registration_number='CHY12345',
            category='children',
            is_active=True
        )
        self.event = Event.objects.create(
            user=self.user,
            slug='test-event',
            event_type=Event.EventType.WEDDING,
            title='Test Event',
            status=Event.Status.ACTIVE
        )
        EventCharity.objects.create(event=self.event, charity=self.charity)

    def test_create_donation(self):
        """Test creating a donation with all fields"""
        donation = Donation.objects.create(
            event=self.event,
            charity=self.charity,
            donor_name='John Doe',
            donor_email='john@example.com',
            amount=Decimal('50.00'),
            currency='EUR',
            message='Congratulations!',
            is_anonymous=False,
            status='pending'
        )
        self.assertEqual(donation.donor_name, 'John Doe')
        self.assertEqual(donation.amount, Decimal('50.00'))
        self.assertEqual(donation.status, 'pending')

    def test_status_pending_default(self):
        """Test that status defaults to pending"""
        donation = Donation.objects.create(
            event=self.event,
            charity=self.charity,
            donor_name='Jane Doe',
            donor_email='jane@example.com',
            amount=Decimal('25.00')
        )
        self.assertEqual(donation.status, 'pending')

    def test_status_succeeded(self):
        """Test succeeded status"""
        donation = Donation.objects.create(
            event=self.event,
            charity=self.charity,
            donor_name='Test Donor',
            donor_email='donor@example.com',
            amount=Decimal('100.00'),
            status=Donation.Status.SUCCEEDED
        )
        self.assertEqual(donation.status, 'succeeded')

    def test_status_failed(self):
        """Test failed status"""
        donation = Donation.objects.create(
            event=self.event,
            charity=self.charity,
            donor_name='Test Donor',
            donor_email='donor@example.com',
            amount=Decimal('100.00'),
            status=Donation.Status.FAILED
        )
        self.assertEqual(donation.status, 'failed')

    def test_status_refunded(self):
        """Test refunded status"""
        donation = Donation.objects.create(
            event=self.event,
            charity=self.charity,
            donor_name='Test Donor',
            donor_email='donor@example.com',
            amount=Decimal('100.00'),
            status=Donation.Status.REFUNDED
        )
        self.assertEqual(donation.status, 'refunded')

    def test_currency_default_eur(self):
        """Test currency defaults to EUR"""
        donation = Donation.objects.create(
            event=self.event,
            charity=self.charity,
            donor_name='Test Donor',
            donor_email='donor@example.com',
            amount=Decimal('50.00')
        )
        self.assertEqual(donation.currency, 'EUR')

    def test_is_anonymous_default_false(self):
        """Test is_anonymous defaults to False"""
        donation = Donation.objects.create(
            event=self.event,
            charity=self.charity,
            donor_name='Test Donor',
            donor_email='donor@example.com',
            amount=Decimal('50.00')
        )
        self.assertFalse(donation.is_anonymous)

    def test_donation_str(self):
        """Test string representation of Donation"""
        donation = Donation.objects.create(
            event=self.event,
            charity=self.charity,
            donor_name='John Smith',
            donor_email='john@example.com',
            amount=Decimal('75.50')
        )
        self.assertEqual(str(donation), 'John Smith - €75.50 to Test Charity')

    def test_donations_ordered_by_created_desc(self):
        """Test donations are ordered by created_at descending"""
        donation1 = Donation.objects.create(
            event=self.event,
            charity=self.charity,
            donor_name='First',
            donor_email='first@example.com',
            amount=Decimal('10.00')
        )
        donation2 = Donation.objects.create(
            event=self.event,
            charity=self.charity,
            donor_name='Second',
            donor_email='second@example.com',
            amount=Decimal('20.00')
        )
        donation3 = Donation.objects.create(
            event=self.event,
            charity=self.charity,
            donor_name='Third',
            donor_email='third@example.com',
            amount=Decimal('30.00')
        )

        donations = list(Donation.objects.all())
        self.assertEqual(donations[0], donation3)
        self.assertEqual(donations[1], donation2)
        self.assertEqual(donations[2], donation1)


class CreateDonationSessionTest(APITestCase):
    """Tests for create_donation_session (POST /api/donations/create-session/)"""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.charity = Charity.objects.create(
            name='Test Charity',
            slug='test-charity',
            description='Test description',
            website='https://test.org',
            registration_number='CHY12345',
            category='children',
            is_active=True
        )
        self.inactive_charity = Charity.objects.create(
            name='Inactive Charity',
            slug='inactive-charity',
            description='Inactive',
            website='https://inactive.org',
            category='health',
            is_active=False
        )
        self.unlinked_charity = Charity.objects.create(
            name='Unlinked Charity',
            slug='unlinked-charity',
            description='Not linked to event',
            website='https://unlinked.org',
            category='animals',
            is_active=True
        )
        self.event = Event.objects.create(
            user=self.user,
            slug='test-event',
            event_type=Event.EventType.WEDDING,
            title='Test Event',
            status=Event.Status.ACTIVE
        )
        self.draft_event = Event.objects.create(
            user=self.user,
            slug='draft-event',
            event_type=Event.EventType.BIRTHDAY,
            title='Draft Event',
            status=Event.Status.DRAFT
        )
        EventCharity.objects.create(event=self.event, charity=self.charity)

    def test_missing_event_slug_returns_400(self):
        """Test that missing event_slug returns 400"""
        response = self.client.post('/api/donations/create-session/', {
            'charity_id': self.charity.id,
            'amount': 50.00,
            'donor_name': 'Test Donor',
            'donor_email': 'donor@example.com'
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_missing_charity_id_returns_400(self):
        """Test that missing charity_id returns 400"""
        response = self.client.post('/api/donations/create-session/', {
            'event_slug': 'test-event',
            'amount': 50.00,
            'donor_name': 'Test Donor',
            'donor_email': 'donor@example.com'
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_missing_amount_returns_400(self):
        """Test that missing amount returns 400"""
        response = self.client.post('/api/donations/create-session/', {
            'event_slug': 'test-event',
            'charity_id': self.charity.id,
            'donor_name': 'Test Donor',
            'donor_email': 'donor@example.com'
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_amount_below_minimum_returns_400(self):
        """Test that amount below €1 returns 400"""
        response = self.client.post('/api/donations/create-session/', {
            'event_slug': 'test-event',
            'charity_id': self.charity.id,
            'amount': 0.50,
            'donor_name': 'Test Donor',
            'donor_email': 'donor@example.com'
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Minimum', response.data.get('error', ''))

    def test_amount_above_maximum_returns_400(self):
        """Test that amount above €100,000 returns 400"""
        response = self.client.post('/api/donations/create-session/', {
            'event_slug': 'test-event',
            'charity_id': self.charity.id,
            'amount': 150000.00,
            'donor_name': 'Test Donor',
            'donor_email': 'donor@example.com'
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Maximum', response.data.get('error', ''))

    def test_nonexistent_event_returns_404(self):
        """Test that non-existent event returns 404"""
        response = self.client.post('/api/donations/create-session/', {
            'event_slug': 'nonexistent-event',
            'charity_id': self.charity.id,
            'amount': 50.00,
            'donor_name': 'Test Donor',
            'donor_email': 'donor@example.com'
        })
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_draft_event_returns_404(self):
        """Test that draft event returns 404"""
        response = self.client.post('/api/donations/create-session/', {
            'event_slug': 'draft-event',
            'charity_id': self.charity.id,
            'amount': 50.00,
            'donor_name': 'Test Donor',
            'donor_email': 'donor@example.com'
        })
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_nonexistent_charity_returns_404(self):
        """Test that non-existent charity returns 404"""
        response = self.client.post('/api/donations/create-session/', {
            'event_slug': 'test-event',
            'charity_id': 99999,
            'amount': 50.00,
            'donor_name': 'Test Donor',
            'donor_email': 'donor@example.com'
        })
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_inactive_charity_returns_404(self):
        """Test that inactive charity returns 404"""
        response = self.client.post('/api/donations/create-session/', {
            'event_slug': 'test-event',
            'charity_id': self.inactive_charity.id,
            'amount': 50.00,
            'donor_name': 'Test Donor',
            'donor_email': 'donor@example.com'
        })
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_charity_not_linked_to_event_returns_400(self):
        """Test that charity not linked to event returns 400"""
        response = self.client.post('/api/donations/create-session/', {
            'event_slug': 'test-event',
            'charity_id': self.unlinked_charity.id,
            'amount': 50.00,
            'donor_name': 'Test Donor',
            'donor_email': 'donor@example.com'
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('not available', response.data.get('error', ''))

    @patch('stripe.checkout.Session.create')
    def test_create_session_success(self, mock_stripe):
        """Test successful Stripe session creation"""
        mock_stripe.return_value = MagicMock(
            id='cs_test_123456789',
            url='https://checkout.stripe.com/pay/cs_test_123456789'
        )

        response = self.client.post('/api/donations/create-session/', {
            'event_slug': 'test-event',
            'charity_id': self.charity.id,
            'amount': 50.00,
            'donor_name': 'Test Donor',
            'donor_email': 'donor@example.com',
            'message': 'Congratulations!'
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('checkout_url', response.data)
        self.assertIn('session_id', response.data)
        self.assertEqual(response.data['session_id'], 'cs_test_123456789')

    @patch('stripe.checkout.Session.create')
    def test_creates_pending_donation_record(self, mock_stripe):
        """Test that a pending donation record is created"""
        mock_stripe.return_value = MagicMock(
            id='cs_test_pending',
            url='https://checkout.stripe.com/pay/cs_test_pending'
        )

        initial_count = Donation.objects.count()

        response = self.client.post('/api/donations/create-session/', {
            'event_slug': 'test-event',
            'charity_id': self.charity.id,
            'amount': 75.00,
            'donor_name': 'Pending Donor',
            'donor_email': 'pending@example.com'
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Donation.objects.count(), initial_count + 1)

        donation = Donation.objects.latest('created_at')
        self.assertEqual(donation.status, 'pending')
        self.assertEqual(donation.donor_name, 'Pending Donor')
        self.assertEqual(donation.amount, Decimal('75.00'))

    @patch('stripe.checkout.Session.create')
    def test_stores_stripe_session_id(self, mock_stripe):
        """Test that Stripe session ID is stored on donation"""
        mock_stripe.return_value = MagicMock(
            id='cs_test_stored_session',
            url='https://checkout.stripe.com/pay/cs_test_stored_session'
        )

        response = self.client.post('/api/donations/create-session/', {
            'event_slug': 'test-event',
            'charity_id': self.charity.id,
            'amount': 100.00,
            'donor_name': 'Session Donor',
            'donor_email': 'session@example.com'
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        donation = Donation.objects.latest('created_at')
        self.assertEqual(donation.stripe_session_id, 'cs_test_stored_session')

    @patch('stripe.checkout.Session.create')
    def test_stripe_error_returns_500(self, mock_stripe):
        """Test that Stripe error returns 500"""
        import stripe
        mock_stripe.side_effect = stripe.error.StripeError('Test error')

        response = self.client.post('/api/donations/create-session/', {
            'event_slug': 'test-event',
            'charity_id': self.charity.id,
            'amount': 50.00,
            'donor_name': 'Error Donor',
            'donor_email': 'error@example.com'
        })

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn('error', response.data)

    @patch('stripe.checkout.Session.create')
    def test_stripe_error_marks_donation_failed(self, mock_stripe):
        """Test that Stripe error marks donation as failed"""
        import stripe
        mock_stripe.side_effect = stripe.error.StripeError('Test error')

        response = self.client.post('/api/donations/create-session/', {
            'event_slug': 'test-event',
            'charity_id': self.charity.id,
            'amount': 50.00,
            'donor_name': 'Failed Donor',
            'donor_email': 'failed@example.com'
        })

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)

        donation = Donation.objects.latest('created_at')
        self.assertEqual(donation.status, 'failed')


@override_settings(STRIPE_WEBHOOK_SECRET='whsec_test_secret')
class StripeWebhookTest(APITestCase):
    """Tests for stripe_webhook (POST /api/webhooks/stripe/)"""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.charity = Charity.objects.create(
            name='Test Charity',
            slug='test-charity',
            description='Test description',
            website='https://test.org',
            category='children',
            is_active=True
        )
        self.event = Event.objects.create(
            user=self.user,
            slug='webhook-event',
            event_type=Event.EventType.WEDDING,
            title='Webhook Event',
            status=Event.Status.ACTIVE
        )
        EventCharity.objects.create(event=self.event, charity=self.charity)
        self.donation = Donation.objects.create(
            event=self.event,
            charity=self.charity,
            donor_name='Webhook Donor',
            donor_email='webhook@example.com',
            amount=Decimal('50.00'),
            status='pending',
            stripe_session_id='cs_test_webhook'
        )

    def test_missing_signature_returns_400(self):
        """Test that missing signature returns 400"""
        response = self.client.post(
            '/api/webhooks/stripe/',
            data='{}',
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 400)

    @patch('stripe.Webhook.construct_event')
    def test_invalid_signature_returns_400(self, mock_construct):
        """Test that invalid signature returns 400"""
        import stripe
        mock_construct.side_effect = stripe.error.SignatureVerificationError(
            'Invalid signature', 'sig_header'
        )

        response = self.client.post(
            '/api/webhooks/stripe/',
            data='{}',
            content_type='application/json',
            HTTP_STRIPE_SIGNATURE='invalid_signature'
        )
        self.assertEqual(response.status_code, 400)

    @patch('stripe.Webhook.construct_event')
    def test_checkout_completed_updates_donation_status(self, mock_construct):
        """Test checkout.session.completed updates donation to succeeded"""
        mock_construct.return_value = {
            'type': 'checkout.session.completed',
            'data': {
                'object': {
                    'id': 'cs_test_webhook',
                    'metadata': {
                        'donation_id': str(self.donation.id)
                    },
                    'payment_intent': 'pi_test_123'
                }
            }
        }

        response = self.client.post(
            '/api/webhooks/stripe/',
            data='{}',
            content_type='application/json',
            HTTP_STRIPE_SIGNATURE='valid_signature'
        )

        self.assertEqual(response.status_code, 200)

        self.donation.refresh_from_db()
        self.assertEqual(self.donation.status, 'succeeded')

    @patch('stripe.Webhook.construct_event')
    def test_checkout_completed_stores_payment_intent(self, mock_construct):
        """Test checkout.session.completed stores payment_intent"""
        mock_construct.return_value = {
            'type': 'checkout.session.completed',
            'data': {
                'object': {
                    'id': 'cs_test_webhook',
                    'metadata': {
                        'donation_id': str(self.donation.id)
                    },
                    'payment_intent': 'pi_test_stored_intent'
                }
            }
        }

        response = self.client.post(
            '/api/webhooks/stripe/',
            data='{}',
            content_type='application/json',
            HTTP_STRIPE_SIGNATURE='valid_signature'
        )

        self.assertEqual(response.status_code, 200)

        self.donation.refresh_from_db()
        self.assertEqual(self.donation.stripe_payment_intent, 'pi_test_stored_intent')

    @patch('stripe.Webhook.construct_event')
    def test_checkout_completed_skips_already_succeeded(self, mock_construct):
        """Test that already succeeded donations are not reprocessed"""
        # Mark donation as already succeeded
        self.donation.status = 'succeeded'
        self.donation.save()

        mock_construct.return_value = {
            'type': 'checkout.session.completed',
            'data': {
                'object': {
                    'id': 'cs_test_webhook',
                    'metadata': {
                        'donation_id': str(self.donation.id)
                    },
                    'payment_intent': 'pi_test_duplicate'
                }
            }
        }

        response = self.client.post(
            '/api/webhooks/stripe/',
            data='{}',
            content_type='application/json',
            HTTP_STRIPE_SIGNATURE='valid_signature'
        )

        self.assertEqual(response.status_code, 200)

        # Payment intent should NOT be updated
        self.donation.refresh_from_db()
        self.assertEqual(self.donation.stripe_payment_intent, '')

    @patch('stripe.Webhook.construct_event')
    def test_checkout_expired_marks_donation_failed(self, mock_construct):
        """Test checkout.session.expired marks donation as failed"""
        mock_construct.return_value = {
            'type': 'checkout.session.expired',
            'data': {
                'object': {
                    'id': 'cs_test_webhook',
                    'metadata': {
                        'donation_id': str(self.donation.id)
                    }
                }
            }
        }

        response = self.client.post(
            '/api/webhooks/stripe/',
            data='{}',
            content_type='application/json',
            HTTP_STRIPE_SIGNATURE='valid_signature'
        )

        self.assertEqual(response.status_code, 200)

        self.donation.refresh_from_db()
        self.assertEqual(self.donation.status, 'failed')

    @patch('stripe.Webhook.construct_event')
    def test_charge_refunded_updates_status(self, mock_construct):
        """Test charge.refunded marks donation as refunded"""
        # First mark as succeeded with payment intent
        self.donation.status = 'succeeded'
        self.donation.stripe_payment_intent = 'pi_refund_test'
        self.donation.save()

        mock_construct.return_value = {
            'type': 'charge.refunded',
            'data': {
                'object': {
                    'id': 'ch_test_refund',
                    'payment_intent': 'pi_refund_test'
                }
            }
        }

        response = self.client.post(
            '/api/webhooks/stripe/',
            data='{}',
            content_type='application/json',
            HTTP_STRIPE_SIGNATURE='valid_signature'
        )

        self.assertEqual(response.status_code, 200)

        self.donation.refresh_from_db()
        self.assertEqual(self.donation.status, 'refunded')

    @patch('stripe.Webhook.construct_event')
    def test_unknown_event_type_returns_200(self, mock_construct):
        """Test unknown event types are handled gracefully"""
        mock_construct.return_value = {
            'type': 'unknown.event.type',
            'data': {
                'object': {}
            }
        }

        response = self.client.post(
            '/api/webhooks/stripe/',
            data='{}',
            content_type='application/json',
            HTTP_STRIPE_SIGNATURE='valid_signature'
        )

        self.assertEqual(response.status_code, 200)

    @patch('stripe.Webhook.construct_event')
    def test_missing_donation_id_in_metadata(self, mock_construct):
        """Test handling when donation_id is missing from metadata"""
        mock_construct.return_value = {
            'type': 'checkout.session.completed',
            'data': {
                'object': {
                    'id': 'cs_test_no_metadata',
                    'metadata': {},
                    'payment_intent': 'pi_test_no_metadata'
                }
            }
        }

        response = self.client.post(
            '/api/webhooks/stripe/',
            data='{}',
            content_type='application/json',
            HTTP_STRIPE_SIGNATURE='valid_signature'
        )

        # Should still return 200, just not update anything
        self.assertEqual(response.status_code, 200)

    @patch('stripe.Webhook.construct_event')
    def test_nonexistent_donation_id(self, mock_construct):
        """Test handling when donation_id doesn't exist in database"""
        mock_construct.return_value = {
            'type': 'checkout.session.completed',
            'data': {
                'object': {
                    'id': 'cs_test_nonexistent',
                    'metadata': {
                        'donation_id': '99999'
                    },
                    'payment_intent': 'pi_test_nonexistent'
                }
            }
        }

        response = self.client.post(
            '/api/webhooks/stripe/',
            data='{}',
            content_type='application/json',
            HTTP_STRIPE_SIGNATURE='valid_signature'
        )

        # Should return 200 even if donation not found (webhook should not fail)
        self.assertEqual(response.status_code, 200)
