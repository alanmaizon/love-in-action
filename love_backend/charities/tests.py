from django.test import TestCase
from django.db import IntegrityError
from rest_framework.test import APITestCase, APIClient
from rest_framework import status

from .models import Charity


class CharityModelTest(TestCase):
    """Tests for Charity model"""

    def test_create_charity(self):
        """Test creating a charity with all fields"""
        charity = Charity.objects.create(
            name='Test Charity',
            slug='test-charity',
            description='A test charity description',
            website='https://testcharity.org',
            registration_number='CHY12345',
            registration_country='IE',
            category='children',
            is_verified=True,
            is_active=True,
            contact_email='contact@testcharity.org'
        )
        self.assertEqual(charity.name, 'Test Charity')
        self.assertEqual(charity.slug, 'test-charity')
        self.assertEqual(charity.category, 'children')
        self.assertTrue(charity.is_verified)

    def test_slug_unique_constraint(self):
        """Test that slug must be unique"""
        Charity.objects.create(
            name='First Charity',
            slug='unique-slug',
            description='First description',
            website='https://first.org',
            category='children'
        )
        with self.assertRaises(IntegrityError):
            Charity.objects.create(
                name='Second Charity',
                slug='unique-slug',
                description='Second description',
                website='https://second.org',
                category='health'
            )

    def test_valid_category_children(self):
        """Test children category"""
        charity = Charity.objects.create(
            name='Children Charity',
            slug='children-charity',
            description='For children',
            website='https://children.org',
            category=Charity.Category.CHILDREN
        )
        self.assertEqual(charity.category, 'children')

    def test_valid_category_health(self):
        """Test health category"""
        charity = Charity.objects.create(
            name='Health Charity',
            slug='health-charity',
            description='For health',
            website='https://health.org',
            category=Charity.Category.HEALTH
        )
        self.assertEqual(charity.category, 'health')

    def test_valid_category_animals(self):
        """Test animals category"""
        charity = Charity.objects.create(
            name='Animal Charity',
            slug='animal-charity',
            description='For animals',
            website='https://animals.org',
            category=Charity.Category.ANIMALS
        )
        self.assertEqual(charity.category, 'animals')

    def test_valid_category_environment(self):
        """Test environment category"""
        charity = Charity.objects.create(
            name='Environment Charity',
            slug='environment-charity',
            description='For environment',
            website='https://env.org',
            category=Charity.Category.ENVIRONMENT
        )
        self.assertEqual(charity.category, 'environment')

    def test_valid_category_international(self):
        """Test international category"""
        charity = Charity.objects.create(
            name='International Charity',
            slug='international-charity',
            description='For international aid',
            website='https://intl.org',
            category=Charity.Category.INTERNATIONAL
        )
        self.assertEqual(charity.category, 'international')

    def test_valid_category_homelessness(self):
        """Test homelessness category"""
        charity = Charity.objects.create(
            name='Homelessness Charity',
            slug='homelessness-charity',
            description='For homeless',
            website='https://homeless.org',
            category=Charity.Category.HOMELESSNESS
        )
        self.assertEqual(charity.category, 'homelessness')

    def test_valid_category_mental_health(self):
        """Test mental health category"""
        charity = Charity.objects.create(
            name='Mental Health Charity',
            slug='mental-health-charity',
            description='For mental health',
            website='https://mentalhealth.org',
            category=Charity.Category.MENTAL_HEALTH
        )
        self.assertEqual(charity.category, 'mental_health')

    def test_valid_category_other(self):
        """Test other category"""
        charity = Charity.objects.create(
            name='Other Charity',
            slug='other-charity',
            description='Other cause',
            website='https://other.org',
            category=Charity.Category.OTHER
        )
        self.assertEqual(charity.category, 'other')

    def test_is_active_default_true(self):
        """Test is_active defaults to True"""
        charity = Charity.objects.create(
            name='Active Charity',
            slug='active-charity',
            description='Should be active',
            website='https://active.org',
            category='children'
        )
        self.assertTrue(charity.is_active)

    def test_is_verified_default_false(self):
        """Test is_verified defaults to False"""
        charity = Charity.objects.create(
            name='Unverified Charity',
            slug='unverified-charity',
            description='Should be unverified',
            website='https://unverified.org',
            category='children'
        )
        self.assertFalse(charity.is_verified)

    def test_category_default_other(self):
        """Test category defaults to 'other'"""
        charity = Charity.objects.create(
            name='Default Category',
            slug='default-category',
            description='Default category test',
            website='https://default.org'
        )
        self.assertEqual(charity.category, 'other')

    def test_registration_country_default_ie(self):
        """Test registration_country defaults to 'IE'"""
        charity = Charity.objects.create(
            name='Irish Charity',
            slug='irish-charity',
            description='Irish charity test',
            website='https://irish.org'
        )
        self.assertEqual(charity.registration_country, 'IE')

    def test_charity_str(self):
        """Test string representation of Charity"""
        charity = Charity.objects.create(
            name='My Amazing Charity',
            slug='amazing-charity',
            description='An amazing cause',
            website='https://amazing.org',
            category='children'
        )
        self.assertEqual(str(charity), 'My Amazing Charity')

    def test_charities_ordered_by_name(self):
        """Test charities are ordered by name by default"""
        Charity.objects.create(
            name='Zebra Charity',
            slug='zebra-charity',
            description='Z charity',
            website='https://zebra.org'
        )
        Charity.objects.create(
            name='Alpha Charity',
            slug='alpha-charity',
            description='A charity',
            website='https://alpha.org'
        )
        Charity.objects.create(
            name='Mango Charity',
            slug='mango-charity',
            description='M charity',
            website='https://mango.org'
        )

        charities = list(Charity.objects.all())
        self.assertEqual(charities[0].name, 'Alpha Charity')
        self.assertEqual(charities[1].name, 'Mango Charity')
        self.assertEqual(charities[2].name, 'Zebra Charity')


class CharityViewSetTest(APITestCase):
    """Tests for CharityViewSet (list/retrieve /api/charities/)"""

    def setUp(self):
        self.client = APIClient()
        self.active_charity1 = Charity.objects.create(
            name='Active Charity One',
            slug='active-one',
            description='First active charity',
            website='https://active1.org',
            category='children',
            is_active=True,
            is_verified=True
        )
        self.active_charity2 = Charity.objects.create(
            name='Active Charity Two',
            slug='active-two',
            description='Second active charity for health',
            website='https://active2.org',
            category='health',
            is_active=True,
            is_verified=False
        )
        self.inactive_charity = Charity.objects.create(
            name='Inactive Charity',
            slug='inactive',
            description='An inactive charity',
            website='https://inactive.org',
            category='animals',
            is_active=False
        )

    def test_list_charities_no_auth_required(self):
        """Test that charity list is publicly accessible"""
        response = self.client.get('/api/charities/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_only_active_charities(self):
        """Test that list only returns active charities"""
        response = self.client.get('/api/charities/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

        slugs = [c['slug'] for c in response.data]
        self.assertIn('active-one', slugs)
        self.assertIn('active-two', slugs)
        self.assertNotIn('inactive', slugs)

    def test_list_charities_serializer_fields(self):
        """Test that list endpoint uses CharityListSerializer with correct fields"""
        response = self.client.get('/api/charities/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        charity = response.data[0]
        self.assertIn('id', charity)
        self.assertIn('name', charity)
        self.assertIn('slug', charity)
        self.assertIn('logo', charity)
        self.assertIn('category', charity)
        self.assertIn('is_verified', charity)

    def test_filter_by_category_children(self):
        """Test filtering charities by children category"""
        response = self.client.get('/api/charities/?category=children')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['slug'], 'active-one')

    def test_filter_by_category_health(self):
        """Test filtering charities by health category"""
        response = self.client.get('/api/charities/?category=health')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['slug'], 'active-two')

    def test_filter_by_invalid_category(self):
        """Test filtering by non-existent category returns empty list"""
        response = self.client.get('/api/charities/?category=nonexistent')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_retrieve_charity_by_slug(self):
        """Test retrieving a single charity by slug"""
        response = self.client.get('/api/charities/active-one/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Active Charity One')
        self.assertEqual(response.data['slug'], 'active-one')
        self.assertEqual(response.data['category'], 'children')

    def test_retrieve_charity_full_details(self):
        """Test retrieve endpoint returns full charity details"""
        response = self.client.get('/api/charities/active-one/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Full serializer should include all fields
        self.assertIn('id', response.data)
        self.assertIn('name', response.data)
        self.assertIn('slug', response.data)
        self.assertIn('description', response.data)
        self.assertIn('website', response.data)
        self.assertIn('category', response.data)
        self.assertIn('is_verified', response.data)

    def test_retrieve_inactive_charity_404(self):
        """Test that inactive charities return 404"""
        response = self.client.get('/api/charities/inactive/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_retrieve_nonexistent_charity_404(self):
        """Test 404 for non-existent slug"""
        response = self.client.get('/api/charities/nonexistent/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_search_by_name(self):
        """Test searching charities by name"""
        response = self.client.get('/api/charities/?search=One')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['slug'], 'active-one')

    def test_search_by_description(self):
        """Test searching charities by description"""
        response = self.client.get('/api/charities/?search=health')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['slug'], 'active-two')

    def test_search_case_insensitive(self):
        """Test that search is case insensitive"""
        response = self.client.get('/api/charities/?search=ACTIVE')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_search_no_results(self):
        """Test search with no matching results"""
        response = self.client.get('/api/charities/?search=xyznonexistent')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_combine_search_and_category_filter(self):
        """Test combining search and category filter"""
        # Create another children charity
        Charity.objects.create(
            name='Another Children Charity',
            slug='another-children',
            description='Another one for children',
            website='https://another.org',
            category='children',
            is_active=True
        )

        # Search for 'charity' within children category
        response = self.client.get('/api/charities/?category=children&search=Active')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['slug'], 'active-one')
