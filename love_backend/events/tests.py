from decimal import Decimal
from django.test import TestCase
from django.contrib.auth.models import User
from django.db import IntegrityError
from rest_framework.test import APITestCase, APIClient
from rest_framework import status

from .models import Event, EventCharity
from charities.models import Charity
from donations.models import Donation


class EventModelTest(TestCase):
    """Tests for Event model"""

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

    def test_create_event_wedding(self):
        """Test creating a wedding event"""
        event = Event.objects.create(
            user=self.user,
            slug='test-wedding',
            event_type=Event.EventType.WEDDING,
            title='John & Jane Wedding'
        )
        self.assertEqual(event.event_type, 'wedding')
        self.assertEqual(event.title, 'John & Jane Wedding')

    def test_create_event_christening(self):
        """Test creating a christening event"""
        event = Event.objects.create(
            user=self.user,
            slug='test-christening',
            event_type=Event.EventType.CHRISTENING,
            title='Baby Emma Christening'
        )
        self.assertEqual(event.event_type, 'christening')

    def test_create_event_birthday(self):
        """Test creating a birthday event"""
        event = Event.objects.create(
            user=self.user,
            slug='test-birthday',
            event_type=Event.EventType.BIRTHDAY,
            title='50th Birthday Celebration'
        )
        self.assertEqual(event.event_type, 'birthday')

    def test_create_event_memorial(self):
        """Test creating a memorial event"""
        event = Event.objects.create(
            user=self.user,
            slug='test-memorial',
            event_type=Event.EventType.MEMORIAL,
            title='In Memory of John'
        )
        self.assertEqual(event.event_type, 'memorial')

    def test_slug_unique_constraint(self):
        """Test that slug must be unique"""
        Event.objects.create(
            user=self.user,
            slug='unique-slug',
            event_type=Event.EventType.WEDDING,
            title='First Event'
        )
        with self.assertRaises(IntegrityError):
            Event.objects.create(
                user=self.user,
                slug='unique-slug',
                event_type=Event.EventType.WEDDING,
                title='Second Event'
            )

    def test_event_status_draft_default(self):
        """Test that default status is draft"""
        event = Event.objects.create(
            user=self.user,
            slug='draft-event',
            event_type=Event.EventType.WEDDING,
            title='Draft Event'
        )
        self.assertEqual(event.status, Event.Status.DRAFT)

    def test_event_status_transitions(self):
        """Test changing event status"""
        event = Event.objects.create(
            user=self.user,
            slug='status-event',
            event_type=Event.EventType.WEDDING,
            title='Status Event'
        )
        self.assertEqual(event.status, Event.Status.DRAFT)

        event.status = Event.Status.ACTIVE
        event.save()
        event.refresh_from_db()
        self.assertEqual(event.status, Event.Status.ACTIVE)

        event.status = Event.Status.CLOSED
        event.save()
        event.refresh_from_db()
        self.assertEqual(event.status, Event.Status.CLOSED)

    def test_total_raised_no_donations(self):
        """Test total_raised returns 0 when no donations"""
        event = Event.objects.create(
            user=self.user,
            slug='no-donations',
            event_type=Event.EventType.WEDDING,
            title='No Donations Event'
        )
        self.assertEqual(event.total_raised(), 0)

    def test_total_raised_with_succeeded_donations(self):
        """Test total_raised sums succeeded donations"""
        event = Event.objects.create(
            user=self.user,
            slug='with-donations',
            event_type=Event.EventType.WEDDING,
            title='With Donations Event',
            status=Event.Status.ACTIVE
        )
        EventCharity.objects.create(event=event, charity=self.charity)

        Donation.objects.create(
            event=event,
            charity=self.charity,
            donor_name='Donor 1',
            donor_email='donor1@example.com',
            amount=Decimal('50.00'),
            status='succeeded'
        )
        Donation.objects.create(
            event=event,
            charity=self.charity,
            donor_name='Donor 2',
            donor_email='donor2@example.com',
            amount=Decimal('75.00'),
            status='succeeded'
        )

        self.assertEqual(event.total_raised(), Decimal('125.00'))

    def test_total_raised_ignores_pending_donations(self):
        """Test total_raised excludes pending donations"""
        event = Event.objects.create(
            user=self.user,
            slug='pending-donations',
            event_type=Event.EventType.WEDDING,
            title='Pending Donations Event',
            status=Event.Status.ACTIVE
        )
        EventCharity.objects.create(event=event, charity=self.charity)

        Donation.objects.create(
            event=event,
            charity=self.charity,
            donor_name='Donor 1',
            donor_email='donor1@example.com',
            amount=Decimal('50.00'),
            status='succeeded'
        )
        Donation.objects.create(
            event=event,
            charity=self.charity,
            donor_name='Donor 2',
            donor_email='donor2@example.com',
            amount=Decimal('100.00'),
            status='pending'
        )

        self.assertEqual(event.total_raised(), Decimal('50.00'))

    def test_total_raised_ignores_failed_donations(self):
        """Test total_raised excludes failed donations"""
        event = Event.objects.create(
            user=self.user,
            slug='failed-donations',
            event_type=Event.EventType.WEDDING,
            title='Failed Donations Event',
            status=Event.Status.ACTIVE
        )
        EventCharity.objects.create(event=event, charity=self.charity)

        Donation.objects.create(
            event=event,
            charity=self.charity,
            donor_name='Donor 1',
            donor_email='donor1@example.com',
            amount=Decimal('50.00'),
            status='succeeded'
        )
        Donation.objects.create(
            event=event,
            charity=self.charity,
            donor_name='Donor 2',
            donor_email='donor2@example.com',
            amount=Decimal('100.00'),
            status='failed'
        )

        self.assertEqual(event.total_raised(), Decimal('50.00'))

    def test_donor_count_unique_emails(self):
        """Test donor_count returns distinct donors by email"""
        event = Event.objects.create(
            user=self.user,
            slug='donor-count',
            event_type=Event.EventType.WEDDING,
            title='Donor Count Event',
            status=Event.Status.ACTIVE
        )
        EventCharity.objects.create(event=event, charity=self.charity)

        # Same email donates twice
        Donation.objects.create(
            event=event,
            charity=self.charity,
            donor_name='Donor 1',
            donor_email='same@example.com',
            amount=Decimal('50.00'),
            status='succeeded'
        )
        Donation.objects.create(
            event=event,
            charity=self.charity,
            donor_name='Donor 1 Again',
            donor_email='same@example.com',
            amount=Decimal('25.00'),
            status='succeeded'
        )
        # Different email
        Donation.objects.create(
            event=event,
            charity=self.charity,
            donor_name='Donor 2',
            donor_email='different@example.com',
            amount=Decimal('75.00'),
            status='succeeded'
        )

        self.assertEqual(event.donor_count(), 2)

    def test_donor_count_only_succeeded(self):
        """Test donor_count only counts succeeded donations"""
        event = Event.objects.create(
            user=self.user,
            slug='donor-count-status',
            event_type=Event.EventType.WEDDING,
            title='Donor Count Status Event',
            status=Event.Status.ACTIVE
        )
        EventCharity.objects.create(event=event, charity=self.charity)

        Donation.objects.create(
            event=event,
            charity=self.charity,
            donor_name='Donor 1',
            donor_email='donor1@example.com',
            amount=Decimal('50.00'),
            status='succeeded'
        )
        Donation.objects.create(
            event=event,
            charity=self.charity,
            donor_name='Donor 2',
            donor_email='donor2@example.com',
            amount=Decimal('25.00'),
            status='pending'
        )
        Donation.objects.create(
            event=event,
            charity=self.charity,
            donor_name='Donor 3',
            donor_email='donor3@example.com',
            amount=Decimal('75.00'),
            status='failed'
        )

        self.assertEqual(event.donor_count(), 1)

    def test_event_str(self):
        """Test string representation of Event"""
        event = Event.objects.create(
            user=self.user,
            slug='str-test',
            event_type=Event.EventType.WEDDING,
            title='My Beautiful Wedding'
        )
        self.assertEqual(str(event), 'My Beautiful Wedding')


class EventCharityModelTest(TestCase):
    """Tests for EventCharity through table"""

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.event = Event.objects.create(
            user=self.user,
            slug='test-event',
            event_type=Event.EventType.WEDDING,
            title='Test Event'
        )
        self.charity1 = Charity.objects.create(
            name='Charity One',
            slug='charity-one',
            description='Description one',
            website='https://one.org',
            registration_number='CHY11111',
            category='children',
            is_active=True
        )
        self.charity2 = Charity.objects.create(
            name='Charity Two',
            slug='charity-two',
            description='Description two',
            website='https://two.org',
            registration_number='CHY22222',
            category='health',
            is_active=True
        )

    def test_event_charity_unique_together(self):
        """Test that event-charity combination must be unique"""
        EventCharity.objects.create(
            event=self.event,
            charity=self.charity1,
            display_order=0
        )
        with self.assertRaises(IntegrityError):
            EventCharity.objects.create(
                event=self.event,
                charity=self.charity1,
                display_order=1
            )

    def test_display_order_default(self):
        """Test default display_order is 0"""
        ec = EventCharity.objects.create(
            event=self.event,
            charity=self.charity1
        )
        self.assertEqual(ec.display_order, 0)

    def test_ordering_by_display_order(self):
        """Test EventCharity ordering by display_order"""
        ec2 = EventCharity.objects.create(
            event=self.event,
            charity=self.charity2,
            display_order=1
        )
        ec1 = EventCharity.objects.create(
            event=self.event,
            charity=self.charity1,
            display_order=0
        )

        ordered = list(EventCharity.objects.filter(event=self.event))
        self.assertEqual(ordered[0], ec1)
        self.assertEqual(ordered[1], ec2)

    def test_event_charity_str(self):
        """Test string representation of EventCharity"""
        ec = EventCharity.objects.create(
            event=self.event,
            charity=self.charity1
        )
        self.assertEqual(str(ec), 'Test Event - Charity One')


class PublicEventViewTest(APITestCase):
    """Tests for PublicEventView (GET /api/events/<slug>/)"""

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
        self.active_event = Event.objects.create(
            user=self.user,
            slug='active-event',
            event_type=Event.EventType.WEDDING,
            title='Active Event',
            status=Event.Status.ACTIVE,
            story='A beautiful story'
        )
        EventCharity.objects.create(
            event=self.active_event,
            charity=self.charity
        )

    def test_get_active_event_by_slug(self):
        """Test retrieving an active event by slug"""
        response = self.client.get('/api/events/active-event/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Active Event')
        self.assertEqual(response.data['slug'], 'active-event')

    def test_get_draft_event_returns_404(self):
        """Test that draft events are not accessible"""
        Event.objects.create(
            user=self.user,
            slug='draft-event',
            event_type=Event.EventType.WEDDING,
            title='Draft Event',
            status=Event.Status.DRAFT
        )
        response = self.client.get('/api/events/draft-event/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_get_closed_event_returns_404(self):
        """Test that closed events are not accessible"""
        Event.objects.create(
            user=self.user,
            slug='closed-event',
            event_type=Event.EventType.WEDDING,
            title='Closed Event',
            status=Event.Status.CLOSED
        )
        response = self.client.get('/api/events/closed-event/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_get_nonexistent_event_returns_404(self):
        """Test 404 for non-existent slug"""
        response = self.client.get('/api/events/nonexistent/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_response_includes_event_charities(self):
        """Test response includes linked charities"""
        response = self.client.get('/api/events/active-event/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('event_charities', response.data)
        self.assertEqual(len(response.data['event_charities']), 1)
        self.assertEqual(
            response.data['event_charities'][0]['charity']['name'],
            'Test Charity'
        )

    def test_response_includes_total_raised(self):
        """Test response includes total_raised field"""
        response = self.client.get('/api/events/active-event/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_raised', response.data)

    def test_response_includes_donor_count(self):
        """Test response includes donor_count field"""
        response = self.client.get('/api/events/active-event/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('donor_count', response.data)


class DashboardEventViewSetTest(APITestCase):
    """Tests for DashboardEventViewSet (CRUD /api/dashboard/events/)"""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.other_user = User.objects.create_user(
            username='otheruser',
            email='other@example.com',
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
            slug='my-event',
            event_type=Event.EventType.WEDDING,
            title='My Event',
            status=Event.Status.ACTIVE
        )
        self.other_event = Event.objects.create(
            user=self.other_user,
            slug='other-event',
            event_type=Event.EventType.BIRTHDAY,
            title='Other Event',
            status=Event.Status.ACTIVE
        )

    def test_list_requires_auth(self):
        """Test that list endpoint requires authentication"""
        response = self.client.get('/api/dashboard/events/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_requires_auth(self):
        """Test that create endpoint requires authentication"""
        response = self.client.post('/api/dashboard/events/', {
            'slug': 'new-event',
            'event_type': 'wedding',
            'title': 'New Event'
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_retrieve_requires_auth(self):
        """Test that retrieve endpoint requires authentication"""
        response = self.client.get(f'/api/dashboard/events/{self.event.id}/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_update_requires_auth(self):
        """Test that update endpoint requires authentication"""
        response = self.client.patch(f'/api/dashboard/events/{self.event.id}/', {
            'title': 'Updated Title'
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_delete_requires_auth(self):
        """Test that delete endpoint requires authentication"""
        response = self.client.delete(f'/api/dashboard/events/{self.event.id}/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_only_own_events(self):
        """Test that users can only see their own events"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/dashboard/events/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], 'My Event')

    def test_cannot_access_other_user_event(self):
        """Test that users cannot access other users' events"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(f'/api/dashboard/events/{self.other_event.id}/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_event_success(self):
        """Test creating a new event"""
        self.client.force_authenticate(user=self.user)
        response = self.client.post('/api/dashboard/events/', {
            'slug': 'new-wedding',
            'event_type': 'wedding',
            'title': 'New Wedding',
            'story': 'Our love story',
            'charity_ids': []
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], 'New Wedding')
        self.assertEqual(response.data['status'], 'draft')

        # Verify event belongs to authenticated user
        event = Event.objects.get(slug='new-wedding')
        self.assertEqual(event.user, self.user)

    def test_create_event_with_charities(self):
        """Test creating an event with linked charities"""
        self.client.force_authenticate(user=self.user)
        response = self.client.post('/api/dashboard/events/', {
            'slug': 'charity-event',
            'event_type': 'christening',
            'title': 'Charity Event',
            'charity_ids': [self.charity.id]
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        event = Event.objects.get(slug='charity-event')
        self.assertEqual(event.charities.count(), 1)
        self.assertEqual(event.charities.first(), self.charity)

    def test_update_event_status(self):
        """Test updating event status"""
        self.client.force_authenticate(user=self.user)
        response = self.client.patch(f'/api/dashboard/events/{self.event.id}/', {
            'status': 'closed'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.event.refresh_from_db()
        self.assertEqual(self.event.status, 'closed')

    def test_update_event_charities(self):
        """Test updating event's linked charities"""
        self.client.force_authenticate(user=self.user)
        charity2 = Charity.objects.create(
            name='Second Charity',
            slug='second-charity',
            description='Second description',
            website='https://second.org',
            registration_number='CHY67890',
            category='health',
            is_active=True
        )

        response = self.client.patch(f'/api/dashboard/events/{self.event.id}/', {
            'charity_ids': [self.charity.id, charity2.id]
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.event.refresh_from_db()
        self.assertEqual(self.event.charities.count(), 2)

    def test_delete_event(self):
        """Test deleting an event"""
        self.client.force_authenticate(user=self.user)
        event_id = self.event.id
        response = self.client.delete(f'/api/dashboard/events/{event_id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        self.assertFalse(Event.objects.filter(id=event_id).exists())

    def test_donations_action(self):
        """Test getting donations for an event"""
        self.client.force_authenticate(user=self.user)
        EventCharity.objects.create(event=self.event, charity=self.charity)
        Donation.objects.create(
            event=self.event,
            charity=self.charity,
            donor_name='Test Donor',
            donor_email='donor@example.com',
            amount=Decimal('50.00'),
            status='succeeded'
        )

        response = self.client.get(f'/api/dashboard/events/{self.event.id}/donations/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['donor_name'], 'Test Donor')
